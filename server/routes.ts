import type { Express } from "express";
import express from "express";
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

interface WebSocketClient extends WebSocket {
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureUploadDir();

  // Serve uploaded files statically
  app.use("/uploads", express.static(UPLOAD_DIR, {
    setHeaders: (res, path) => {
      // Set proper MIME types for video files
      if (path.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (path.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      } else if (path.endsWith('.ogg')) {
        res.setHeader('Content-Type', 'video/ogg');
      } else if (path.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (path.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
      }
    }
  }));

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
      const usersWithStatus = users.map(({ password, status, lastSeen, ...user }) => ({
        ...user,
        online: status === "online",
        status,
        lastSeen,
      }));
      res.json(usersWithStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New endpoint to get unread counts
  app.get("/api/users/:userId/unread-counts", async (req, res) => {
    try {
      const { userId } = req.params;
      const unreadCounts = await storage.getUnreadCountsForUser(userId);
      const countsObject = Object.fromEntries(unreadCounts);
      res.json(countsObject);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New endpoint to mark messages as read
  app.post("/api/messages/mark-read", async (req, res) => {
    try {
      const { senderId, receiverId } = req.body;
      await storage.markMessagesAsRead(senderId, receiverId);
      
      // Notify the sender that their messages were read
      const senderWs = clients.get(senderId);
      if (senderWs && senderWs.readyState === WebSocket.OPEN) {
        senderWs.send(JSON.stringify({
          type: "messagesRead",
          receiverId,
        }));
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // New endpoint to unsend messages
  app.post("/api/messages/unsend", async (req, res) => {
    try {
      const { messageId, userId } = req.body;
      const success = await storage.unsendMessage(messageId, userId);
      
      if (success) {
        // Notify both users about the unsent message
        const message = await storage.getAllMessages().then(messages => 
          messages.find(m => m.id === messageId)
        );
        
        if (message) {
          const unsendData = JSON.stringify({
            type: "messageUnsent",
            messageId,
            senderId: message.senderId,
            receiverId: message.receiverId,
          });

          // Notify sender
          const senderWs = clients.get(message.senderId);
          if (senderWs && senderWs.readyState === WebSocket.OPEN) {
            senderWs.send(unsendData);
          }

          // Notify receiver
          const receiverWs = clients.get(message.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(unsendData);
          }
        }
        
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, message: "Message not found or unauthorized" });
      }
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
      
      // Save file metadata to database
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

  function sendUnreadCountsToUser(userId: string) {
    const userWs = clients.get(userId);
    if (!userWs || userWs.readyState !== WebSocket.OPEN) return;

    storage.getUnreadCountsForUser(userId).then(unreadCounts => {
      const totalUnread = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0);
      
      userWs.send(JSON.stringify({
        type: "unreadCounts",
        counts: Object.fromEntries(unreadCounts),
        total: totalUnread
      }));
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
          
          // Send initial unread counts
          sendUnreadCountsToUser(message.userId);
        } else if (message.type === "sendMessage") {
          if (!ws.userId) return;

          // Create the message with file data if present
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

          // Send to sender
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageData);
          }

          // Send to recipient
          const recipientWs = clients.get(message.receiverId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(messageData);
            
            // Update unread counts for recipient
            sendUnreadCountsToUser(message.receiverId);
          }
          
          // Update unread counts for sender (to show they have new messages in conversation)
          sendUnreadCountsToUser(ws.userId);

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

        } else if (message.type === "markMessagesRead") {
          if (!ws.userId) return;
          
          // Mark all messages from this sender as read for the current user
          await storage.markMessagesAsRead(message.senderId, ws.userId);
          
          // Notify the sender that their messages were read
          const senderWs = clients.get(message.senderId);
          if (senderWs && senderWs.readyState === WebSocket.OPEN) {
            senderWs.send(JSON.stringify({
              type: "messagesRead",
              readerId: ws.userId,
            }));
          }
          
          // Update unread counts for both users
          sendUnreadCountsToUser(ws.userId);
          sendUnreadCountsToUser(message.senderId);
          
        } else if (message.type === "getUnreadCounts") {
          if (!ws.userId) return;
          sendUnreadCountsToUser(ws.userId);
          
        } else if (message.type === "unsendMessage") {
          if (!ws.userId) return;
          
          const success = await storage.unsendMessage(message.messageId, ws.userId);
          
          if (success) {
            // Notify both users about the unsent message
            const unsendData = JSON.stringify({
              type: "messageUnsent",
              messageId: message.messageId,
              senderId: ws.userId,
              receiverId: message.receiverId,
            });

            // Notify sender (current user)
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(unsendData);
            }

            // Notify receiver
            const receiverWs = clients.get(message.receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(unsendData);
            }
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