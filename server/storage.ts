import { type User, type InsertUser, type Message, type InsertMessage, type File, type InsertFile } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const FILES_FILE = path.join(DATA_DIR, "files.json");

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(userId: string, status: string, lastSeen?: Date): Promise<void>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getAllMessages(): Promise<Message[]>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
  unsendMessage(messageId: string, userId: string): Promise<boolean>; // New method for unsend
  
  createFile(file: InsertFile): Promise<File>;
  getFilesByUser(userId: string): Promise<File[]>;
  getAllFiles(): Promise<File[]>;
  
  // New methods for notifications
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  getUnreadCountsForUser(userId: string): Promise<Map<string, number>>;
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJSONFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function writeJSONFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export class JSONStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private messages: Message[] = [];
  private files: File[] = [];
  private initialized = false;

  private async init() {
    if (this.initialized) return;
    
    await ensureDataDir();
    
    const usersData = await readJSONFile<User[]>(USERS_FILE, []);
    usersData.forEach((user) => this.users.set(user.id, user));
    
    this.messages = await readJSONFile<Message[]>(MESSAGES_FILE, []);
    this.files = await readJSONFile<File[]>(FILES_FILE, []);
    
    this.initialized = true;
  }

  private async saveUsers() {
    const usersArray = Array.from(this.users.values());
    await writeJSONFile(USERS_FILE, usersArray);
  }

  private async saveMessages() {
    await writeJSONFile(MESSAGES_FILE, this.messages);
  }

  private async saveFiles() {
    await writeJSONFile(FILES_FILE, this.files);
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.init();
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.init();
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.init();
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      status: "online",
      lastSeen: new Date(),
    };
    this.users.set(id, user);
    await this.saveUsers();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    await this.init();
    return Array.from(this.users.values());
  }

  async updateUserStatus(userId: string, status: string, lastSeen?: Date): Promise<void> {
    await this.init();
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      user.lastSeen = lastSeen || new Date();
      this.users.set(userId, user);
      await this.saveUsers();
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    await this.init();
    const message: Message = {
      ...insertMessage,
      id: randomUUID(),
      timestamp: new Date(),
      read: false,
      isUnsent: false, // Default to false
    };
    this.messages.push(message);
    await this.saveMessages();
    return message;
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    await this.init();
    return this.messages.filter(
      (msg) =>
        ((msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)) &&
        !msg.isUnsent // Don't return unsent messages
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getAllMessages(): Promise<Message[]> {
    await this.init();
    return this.messages;
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    await this.init();
    const messageIndex = this.messages.findIndex(
      (msg) => msg.id === messageId && msg.senderId === userId
    );
    
    if (messageIndex === -1) {
      return false;
    }
    
    this.messages.splice(messageIndex, 1);
    await this.saveMessages();
    return true;
  }

  // New unsend method - marks message as unsent instead of deleting
  async unsendMessage(messageId: string, userId: string): Promise<boolean> {
    await this.init();
    const message = this.messages.find(
      (msg) => msg.id === messageId && msg.senderId === userId
    );
    
    if (!message) {
      return false;
    }
    
    // Mark message as unsent instead of deleting
    message.isUnsent = true;
    await this.saveMessages();
    return true;
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    await this.init();
    const file: File = {
      ...insertFile,
      id: randomUUID(),
      uploadedAt: new Date(),
    };
    this.files.push(file);
    await this.saveFiles();
    return file;
  }

  async getFilesByUser(userId: string): Promise<File[]> {
    await this.init();
    return this.files.filter((file) => file.uploaderId === userId);
  }

  async getAllFiles(): Promise<File[]> {
    await this.init();
    return this.files;
  }

  // New notification methods
  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await this.init();
    let hasChanges = false;
    
    this.messages.forEach(msg => {
      if (msg.senderId === senderId && msg.receiverId === receiverId && !msg.read && !msg.isUnsent) {
        msg.read = true;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      await this.saveMessages();
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    await this.init();
    return this.messages.filter(msg => 
      msg.receiverId === userId && !msg.read && !msg.isUnsent
    ).length;
  }

  async getUnreadCountsForUser(userId: string): Promise<Map<string, number>> {
    await this.init();
    const unreadCounts = new Map<string, number>();
    
    this.messages.forEach(msg => {
      if (msg.receiverId === userId && !msg.read && !msg.isUnsent) {
        const senderId = msg.senderId;
        unreadCounts.set(senderId, (unreadCounts.get(senderId) || 0) + 1);
      }
    });
    
    return unreadCounts;
  }
}

export const storage = new JSONStorage();