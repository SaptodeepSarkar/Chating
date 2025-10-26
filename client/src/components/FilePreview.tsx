import { FileText, Image as ImageIcon, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  fileName: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
  onRemove?: () => void;
  variant?: "preview" | "message";
  className?: string;
}

export function FilePreview({
  fileName,
  fileType,
  fileSize,
  fileUrl,
  onRemove,
  variant = "message",
  className,
}: FilePreviewProps) {
  const isImage = fileType?.startsWith("image/");
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isImage && fileUrl && variant === "message") {
    return (
      <div className={cn("relative group", className)}>
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          data-testid={`image-${fileName}`}
          onClick={() => window.open(fileUrl, "_blank")}
        />
        {onRemove && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
            data-testid="button-remove-file"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate",
        className
      )}
      data-testid={`file-preview-${fileName}`}
    >
      <div className="flex-shrink-0">
        {isImage ? (
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
        ) : (
          <FileText className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate font-mono">{fileName}</p>
        {fileSize && (
          <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
        )}
      </div>
      {fileUrl && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => window.open(fileUrl, "_blank")}
          data-testid="button-download-file"
        >
          <Download className="w-4 h-4" />
        </Button>
      )}
      {onRemove && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          data-testid="button-remove-file"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
