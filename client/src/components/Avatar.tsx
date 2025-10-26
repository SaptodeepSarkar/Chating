import { cn } from "@/lib/utils";

interface AvatarProps {
  username: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const statusSizes = {
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5",
};

export function Avatar({ username, size = "md", online, className }: AvatarProps) {
  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  
  const colorIndex = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center text-white font-medium",
          sizeClasses[size],
          colors[colorIndex]
        )}
        data-testid={`avatar-${username}`}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
            statusSizes[size],
            online ? "bg-status-online" : "bg-status-offline"
          )}
          data-testid={`status-${online ? 'online' : 'offline'}`}
        />
      )}
    </div>
  );
}
