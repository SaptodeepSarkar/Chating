import { cn } from "@/lib/utils";
import { FilePreview } from "./FilePreview";
import type { Message } from "@shared/schema";

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  showAvatar?: boolean;
  senderUsername?: string;
}

export function MessageBubble({ message, isSent, senderUsername }: MessageBubbleProps) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn("flex gap-2 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-200", isSent ? "ml-auto" : "mr-auto")}
      data-testid={`message-${message.id}`}
    >
      <div className={cn("flex flex-col gap-1", isSent && "items-end")}>
        {message.fileUrl && (
          <FilePreview
            fileName={message.fileName || "file"}
            fileType={message.fileType}
            fileSize={message.fileSize}
            fileUrl={message.fileUrl}
            variant="message"
          />
        )}
        {message.content && (
          <div
            className={cn(
              "px-4 py-2.5 text-sm leading-relaxed",
              isSent
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                : "bg-muted text-muted-foreground rounded-2xl rounded-bl-md"
            )}
            data-testid={`text-message-content-${message.id}`}
          >
            {message.content}
          </div>
        )}
        <div className={cn("flex items-center gap-2 px-1", isSent ? "justify-end" : "justify-start")}>
          <span className="text-xs text-muted-foreground font-medium" data-testid={`text-timestamp-${message.id}`}>
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
