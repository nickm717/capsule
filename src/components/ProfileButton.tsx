import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function displayNameKey(userId: string) {
  return `capsule-display-name-${userId}`;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function ProfileButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const key = user ? displayNameKey(user.id) : null;

  const [displayName, setDisplayName] = useState(
    () => (key ? localStorage.getItem(key) ?? "" : "")
  );

  // Re-read when the logged-in user changes
  useEffect(() => {
    setDisplayName(key ? localStorage.getItem(key) ?? "" : "");
  }, [key]);

  // Keep in sync with changes made on the profile page (same tab)
  useEffect(() => {
    if (!key) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setDisplayName(e.newValue ?? "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const currentInitials = getInitials(displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-9 h-9 rounded-full glass border border-border/60 flex items-center justify-center text-sm font-semibold text-foreground shrink-0 active:scale-95 transition-transform duration-150"
          style={{ backgroundColor: "color-mix(in srgb, hsl(var(--background)) 60%, transparent)" }}
          aria-label="Open profile menu"
        >
          {currentInitials ? (
            <span className="text-[13px] font-semibold tracking-tight">{currentInitials}</span>
          ) : (
            <User size={17} strokeWidth={1.8} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="liquid-glass-menu rounded-xl border-0 bg-transparent shadow-none p-1 min-w-[140px]">
        <DropdownMenuItem
          className="py-3 cursor-pointer"
          onSelect={() => navigate("/profile")}
        >
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="py-3 cursor-pointer"
          onSelect={() => navigate("/insights")}
        >
          Insights
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
