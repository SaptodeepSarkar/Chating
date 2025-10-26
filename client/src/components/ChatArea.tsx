import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { MessageBubble } from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilePreview } from "./FilePreview";
import type { Message, User } from "@shared/schema";

interface ChatAreaProps {
  currentUser: User;
  recipient?: User & { online?: boolean };
  messages: Message[];
  onSendMessage: (content: string, file?: File) => void;
  onSendFile: (file: File) => void;
}

export function ChatArea({ currentUser, recipient, messages, onSendMessage, onSendFile }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() && !selectedFile) return;

    if (selectedFile && !messageText.trim()) {
      onSendFile(selectedFile);
      setSelectedFile(null);
    } else {
      onSendMessage(messageText.trim(), selectedFile || undefined);
      setMessageText("");
      setSelectedFile(null);
    }
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!recipient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Send className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Start a conversation</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Search for a user on the left to begin chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="h-16 px-6 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Avatar username={recipient.username} size="md" online={recipient.online} />
          <div>
            <h2 className="text-base font-semibold" data-testid="text-recipient-username">
              {recipient.username}
            </h2>
            <p className="text-xs text-muted-foreground">
              {recipient.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="container-messages">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground" data-testid="text-no-messages">
              No messages yet. Send a message to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isSent={message.senderId === currentUser.id}
              senderUsername={message.senderId === currentUser.id ? currentUser.username : recipient.username}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 flex-shrink-0">
        {selectedFile && (
          <div className="mb-3">
            <FilePreview
              fileName={selectedFile.name}
              fileType={selectedFile.type}
              fileSize={selectedFile.size}
              onRemove={() => setSelectedFile(null)}
              variant="preview"
            />
          </div>
        )}
        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0"
            data-testid="button-attach-file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
            }}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            rows={1}
            data-testid="input-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() && !selectedFile}
            className="flex-shrink-0 rounded-full"
            data-testid="button-send"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
