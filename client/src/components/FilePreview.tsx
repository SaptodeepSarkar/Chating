import { FileText, Image as ImageIcon, Download, X, Play, Film, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [showPreview, setShowPreview] = useState(false);
  
  const isImage = fileType?.startsWith("image/");
  const isVideo = fileType?.startsWith("video/");
  const isAudio = fileType?.startsWith("audio/");
  const isPDF = fileType === "application/pdf";
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPreview(true);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderPreview = () => {
    if (!fileUrl) return null;

    if (isImage) {
      return (
        <div className="relative">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-sm max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            data-testid={`image-${fileName}`}
            onClick={handlePreview}
          />
          {showPreview && (
            <div 
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPreview(false)}
            >
              <div className="relative max-w-full max-h-full">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-4 right-4"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="relative max-w-sm">
          <div className="rounded-lg bg-black/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Film className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Video</span>
            </div>
            <video
              controls
              className="w-full rounded max-h-48"
              preload="metadata"
              data-testid={`video-player-${fileName}`}
            >
              <source src={fileUrl} type={fileType} />
              Your browser does not support the video tag.
            </video>
            <p className="text-xs text-muted-foreground mt-2 truncate">
              {fileName}
            </p>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="max-w-sm rounded-lg bg-black/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Headphones className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Audio</span>
          </div>
          <audio 
            controls 
            className="w-full"
            data-testid={`audio-player-${fileName}`}
          >
            <source src={fileUrl} type={fileType} />
            Your browser does not support the audio tag.
          </audio>
          <p className="text-xs text-muted-foreground mt-2 truncate">
            {fileName}
          </p>
        </div>
      );
    }

    // For PDF and other files
    return (
      <div className="max-w-sm rounded-lg bg-black/5 p-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            {fileSize && (
              <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            data-testid="button-download-file"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
        {isPDF && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(fileUrl, '_blank')}
              className="w-full"
            >
              Open PDF in new tab
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (variant === "message" && (isImage || isVideo || isAudio || isPDF)) {
    return (
      <div className={cn("relative group", className)}>
        {renderPreview()}
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

  // Default file preview for non-media files
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors",
        className
      )}
      data-testid={`file-preview-${fileName}`}
    >
      <div className="flex-shrink-0">
        {isImage ? (
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
        ) : isVideo ? (
          <Film className="w-5 h-5 text-muted-foreground" />
        ) : isAudio ? (
          <Headphones className="w-5 h-5 text-muted-foreground" />
        ) : (
          <FileText className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {fileSize && (
          <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
        )}
      </div>
      {fileUrl && (
        <div className="flex gap-1">
          {(isImage || isVideo || isAudio) && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePreview}
              data-testid="button-preview-file"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            data-testid="button-download-file"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
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