import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      await ensureUploadDir();
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

interface WebSocketClient extends WebSocket {
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureUploadDir();

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.json({ success: false, message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        username: data.username,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } catch (error: any) {
      res.json({ success: false, message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(data.username);
      if (!user) {
        return res.json({ success: false, message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.json({ success: false, message: "Invalid credentials" });
      }

      await storage.updateUserStatus(user.id, "online");

      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } catch (error: any) {
      res.json({ success: false, message: error.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithStatus = users.map(({ password, status, ...user }) => ({
        ...user,
        online: status === "online",
        status,
      }));
      res.json(usersWithStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.json({ success: false, message: "No file uploaded" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      const uploaderId = req.body.uploaderId || req.body.receiverId;
      if (uploaderId) {
        await storage.createFile({
          uploaderId,
          fileName: req.file.originalname,
          fileUrl,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
        });
      }

      res.json({
        success: true,
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });
    } catch (error: any) {
      res.json({ success: false, message: error.message });
    }
  });

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });
  
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Map<string, WebSocketClient>();

  function broadcastUserStatus(userId: string, online: boolean) {
    const message = JSON.stringify({
      type: "userStatus",
      userId,
      online,
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  wss.on("connection", (ws: WebSocketClient) => {
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "auth") {
          ws.userId = message.userId;
          clients.set(message.userId, ws);
          await storage.updateUserStatus(message.userId, "online");
          broadcastUserStatus(message.userId, true);
        } else if (message.type === "sendMessage") {
          if (!ws.userId) return;

          const newMessage = await storage.createMessage({
            senderId: ws.userId,
            receiverId: message.receiverId,
            content: message.content,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileType: message.fileType,
            fileSize: message.fileSize,
          });

          const messageData = JSON.stringify({
            type: "message",
            message: newMessage,
          });

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageData);
          }

          const recipientWs = clients.get(message.receiverId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(messageData);
          }
        } else if (message.type === "getMessages") {
          if (!ws.userId) return;

          const messages = await storage.getMessagesBetweenUsers(
            ws.userId,
            message.otherUserId
          );

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "messages",
                messages,
              })
            );
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", async () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        await storage.updateUserStatus(ws.userId, "offline");
        broadcastUserStatus(ws.userId, false);
      }
    });
  });

  return httpServer;
}
