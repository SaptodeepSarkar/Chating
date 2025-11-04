import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/Avatar";
import { FilePreview } from "@/components/FilePreview";
import { Paperclip, Send, Image as ImageIcon, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, Message } from "@shared/schema";

interface ChatAreaProps {
  currentUser: User;
  recipient?: User;
  messages: Message[];
  onSendMessage: (content: string, file?: File) => void;
  onSendFile: (file: File) => void;
  onUnsendMessage: (messageId: string, receiverId: string) => void;
}

export function ChatArea({
  currentUser,
  recipient,
  messages,
  onSendMessage,
  onSendFile,
  onUnsendMessage,
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [menuOpenMessageId, setMenuOpenMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() || selectedFile) {
      onSendMessage(newMessage.trim(), selectedFile || undefined);
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendFileOnly = () => {
    if (selectedFile) {
      onSendFile(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUnsend = (messageId: string, receiverId: string) => {
    if (window.confirm("Are you sure you want to unsend this message? This action cannot be undone.")) {
      onUnsendMessage(messageId, receiverId);
      setMenuOpenMessageId(null);
    }
  };

  const formatMessageTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', 'day': 'numeric' }) + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const isSameMinute = (timestamp1: string | Date, timestamp2: string | Date) => {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate() &&
      date1.getHours() === date2.getHours() &&
      date1.getMinutes() === date2.getMinutes()
    );
  };

  const isConsecutiveMessage = (currentMsg: Message, previousMsg?: Message) => {
    if (!previousMsg) return false;
    
    const timeDiff = new Date(currentMsg.timestamp).getTime() - new Date(previousMsg.timestamp).getTime();
    const isSameSender = currentMsg.senderId === previousMsg.senderId;
    const isWithin5Minutes = timeDiff < 5 * 60 * 1000; // 5 minutes
    
    return isSameSender && isWithin5Minutes;
  };

  const getMessageGroupInfo = (messages: Message[], currentIndex: number) => {
    const currentMessage = messages[currentIndex];
    const isOwnMessage = currentMessage.senderId === currentUser.id;
    
    // Find previous message in the same group
    let groupStartIndex = currentIndex;
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevMessage = messages[i];
      if (prevMessage.senderId !== currentMessage.senderId) break;
      if (!isConsecutiveMessage(prevMessage, messages[i + 1])) break;
      groupStartIndex = i;
    }
    
    // Find next message in the same group
    let groupEndIndex = currentIndex;
    for (let i = currentIndex + 1; i < messages.length; i++) {
      const nextMessage = messages[i];
      if (nextMessage.senderId !== currentMessage.senderId) break;
      if (!isConsecutiveMessage(nextMessage, messages[i - 1])) break;
      groupEndIndex = i;
    }
    
    const isFirstInGroup = groupStartIndex === currentIndex;
    const isLastInGroup = groupEndIndex === currentIndex;
    const isSingleMessage = isFirstInGroup && isLastInGroup;
    const isMiddleInGroup = !isFirstInGroup && !isLastInGroup;
    
    return {
      isFirstInGroup,
      isLastInGroup,
      isSingleMessage,
      isMiddleInGroup,
      isOwnMessage
    };
  };

  const getMessageBorderRadius = (groupInfo: {
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    isSingleMessage: boolean;
    isMiddleInGroup: boolean;
    isOwnMessage: boolean;
  }) => {
    const { isFirstInGroup, isLastInGroup, isSingleMessage, isMiddleInGroup, isOwnMessage } = groupInfo;
    
    if (isSingleMessage) {
      return isOwnMessage ? "rounded-l-2xl rounded-tr-2xl rounded-br-md" : "rounded-r-2xl rounded-tl-2xl rounded-bl-md";
    }
    
    if (isFirstInGroup) {
      return isOwnMessage ? "rounded-l-2xl rounded-tr-2xl rounded-br-md" : "rounded-r-2xl rounded-tl-2xl rounded-bl-md";
    }
    
    if (isLastInGroup) {
      return isOwnMessage ? "rounded-l-2xl rounded-br-md rounded-tr-md" : "rounded-r-2xl rounded-bl-md rounded-tl-md";
    }
    
    // Middle message in group - both sides sharp
    if (isMiddleInGroup) {
      return isOwnMessage ? "rounded-l-2xl rounded-tr-md rounded-br-md" : "rounded-r-2xl rounded-tl-md rounded-bl-md";
    }
    
    return isOwnMessage ? "rounded-l-2xl rounded-tr-2xl rounded-br-md" : "rounded-r-2xl rounded-tl-2xl rounded-bl-md";
  };

  const shouldShowTimestamp = (currentMsg: Message, nextMsg?: Message) => {
      // Always show timestamp if there's no next message (last message)
      if (!nextMsg) return true;
      
      // Show timestamp if messages are from different senders
      if (currentMsg.senderId !== nextMsg.senderId) return true;
      
      // Show timestamp if messages are not in the same minute
      if (!isSameMinute(currentMsg.timestamp, nextMsg.timestamp)) return true;
      
      // Don't show timestamp if messages are from same sender and in same minute
      return false;
    };

  // Function to check if two dates are on the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Function to format date separator
  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isSameDay(date, today)) {
      return "Today";
    } else if (isSameDay(date, yesterday)) {
      return "Yesterday";
    } else {
      // For older messages, show the day name
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  // Function to check if we need to show a date separator before a message
  const shouldShowDateSeparator = (currentMsg: Message, previousMsg?: Message) => {
    // Always show separator for the first message
    if (!previousMsg) return true;
    
    const currentDate = new Date(currentMsg.timestamp);
    const previousDate = new Date(previousMsg.timestamp);
    
    // Show separator if messages are from different days
    return !isSameDay(currentDate, previousDate);
  };

  // Function to group messages by date and add separators
  const getMessagesWithDateSeparators = () => {
    const result: (Message | { type: 'separator'; date: Date; id: string })[] = [];
    
    messages.forEach((message, index) => {
      const previousMessage = index > 0 ? messages[index - 1] : undefined;
      
      // Add date separator if needed
      if (shouldShowDateSeparator(message, previousMessage)) {
        result.push({
          type: 'separator',
          date: new Date(message.timestamp),
          id: `separator-${message.id}`
        });
      }
      
      // Add the message
      result.push(message);
    });
    
    return result;
  };
  
  // Add this formatLastSeen function inside the ChatArea component:
  const formatLastSeen = (lastSeen: Date | null) => {
    if (!lastSeen) return "Never";
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  if (!recipient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No conversation selected</h3>
          <p className="text-muted-foreground max-w-sm">
            Choose a user from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  const messagesWithSeparators = getMessagesWithDateSeparators();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex items-center gap-3 flex-shrink-0">
        <Avatar 
          username={recipient.username} 
          size="md" 
          online={'online' in recipient ? recipient.online : true} 
        />
        <div className="flex-1">
          <h2 className="text-lg font-semibold" data-testid="text-chat-partner">
            {recipient.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            {('online' in recipient && recipient.online) 
              ? "Online" 
              : `Offline - last seen: ${formatLastSeen(recipient.lastSeen)}`
            }
            {recipient.id === "bot" && " • AI Assistant"}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5 bg-background">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation by sending a message</p>
            </div>
          </div>
        ) : (
          messagesWithSeparators.map((item) => {
            if ('type' in item && item.type === 'separator') {
              // Render date separator
              return (
                <div key={item.id} className="flex items-center justify-center my-4">
                  <div className="bg-muted/50 px-3 py-1 rounded-full text-xs text-muted-foreground font-medium">
                    {formatDateSeparator(item.date)}
                  </div>
                </div>
              );
            }

            const message = item as Message;
            const index = messages.findIndex(m => m.id === message.id);
            const previousMessage = index > 0 ? messages[index - 1] : undefined;
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
            const isOwnMessage = message.senderId === currentUser.id;
            const groupInfo = getMessageGroupInfo(messages, index);
            const borderRadius = getMessageBorderRadius(groupInfo);
            const showTimestamp = shouldShowTimestamp(message, nextMessage);

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 group",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {/* Avatar for received messages - only show for first message in group */}
                {!isOwnMessage && groupInfo.isFirstInGroup && (
                  <Avatar 
                    username={recipient.username} 
                    size="sm" 
                    className="flex-shrink-0"
                  />
                )}
                
                {/* Spacer for consecutive messages to align with avatar */}
                {!isOwnMessage && !groupInfo.isFirstInGroup && (
                  <div className="w-8 flex-shrink-0" />
                )}

                {/* Message Content */}
                <div
                  className={cn(
                    "flex flex-col gap-1 max-w-[70%]",
                    isOwnMessage ? "items-end" : "items-start"
                  )}
                >
                  {/* Sender name for group chats or first message in sequence */}
                  {!isOwnMessage && groupInfo.isFirstInGroup && (
                    <p className="text-xs font-medium text-muted-foreground px-1">
                      {recipient.username}
                    </p>
                  )}

                  {/* Message bubble */}
                  <div
                    className={cn(
                      "px-4 py-2 relative group/message",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border",
                      borderRadius
                    )}
                  >
                    {/* File attachment */}
                    {message.fileUrl && (
                      <div className={cn(
                        "mb-2",
                        message.content ? "mb-3" : "mb-0"
                      )}>
                        <FilePreview
                          fileName={message.fileName || "File"}
                          fileType={message.fileType}
                          fileSize={message.fileSize}
                          fileUrl={message.fileUrl}
                          variant="message"
                        />
                      </div>
                    )}
                    
                    {/* Message text */}
                    {message.content && (
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}

                    {/* Unsend menu for own messages */}
                    {isOwnMessage && hoveredMessageId === message.id && (
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover/message:opacity-100 transition-all duration-200">
                        <div className="relative" ref={menuRef}>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="w-5 h-5 rounded-full bg-background/80 backdrop-blur-sm border shadow-md hover:bg-background hover:shadow-lg transition-all duration-200"
                            onClick={() => setMenuOpenMessageId(
                              menuOpenMessageId === message.id ? null : message.id
                            )}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                          
                          {menuOpenMessageId === message.id && (
                            <div className="absolute top-full right-0 mt-1 bg-popover/20 border border-border/50 rounded-lg shadow-xl z-50 py-2 min-w-[140px] backdrop-blur-sm">
                              <button
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-all duration-200 hover:pl-5 group/unsend"
                                onClick={() => handleUnsend(message.id, message.receiverId)}
                              >
                                <Trash2 className="w-4 h-4 group-hover/unsend:scale-110 transition-transform" />
                                Unsend Message
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timestamp - only show when appropriate */}
                  {showTimestamp && (
                    <div className={cn(
                      "flex items-center gap-2 px-1",
                      isOwnMessage ? "flex-row-reverse" : "flex-row"
                    )}>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {message.read && isOwnMessage && (
                        <span className="text-xs text-primary">Read</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Avatar for sent messages - only show for first message in group */}
                {isOwnMessage && groupInfo.isFirstInGroup && (
                  <Avatar 
                    username={currentUser.username} 
                    size="sm" 
                    className="flex-shrink-0"
                  />
                )}
                
                {/* Spacer for consecutive sent messages */}
                {isOwnMessage && !groupInfo.isFirstInGroup && (
                  <div className="w-8 flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="border-t bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">File to send:</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeSelectedFile}
              data-testid="button-remove-selected-file"
            >
              Remove
            </Button>
          </div>
          <FilePreview
            fileName={selectedFile.name}
            fileType={selectedFile.type}
            fileSize={selectedFile.size}
            onRemove={removeSelectedFile}
            variant="preview"
          />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-card p-4 flex-shrink-0">
        <div className="flex gap-2">
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            data-testid="file-input"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-attach-file"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-input bg-background rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[40px] max-h-[120px] text-foreground placeholder:text-muted-foreground"
              rows={1}
              data-testid="message-input"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={selectedFile && !newMessage.trim() ? handleSendFileOnly : handleSendMessage}
            disabled={!newMessage.trim() && !selectedFile}
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}