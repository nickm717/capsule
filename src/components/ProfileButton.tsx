import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Pencil, Check, X, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const DISPLAY_NAME_KEY = "capsule-display-name";

const PALETTE = [
  { name: "Espresso",     hex: "#3B1F14" },
  { name: "Burnt Sienna", hex: "#8B3A2A" },
  { name: "Terracotta",   hex: "#C2622D" },
  { name: "Warm Rust",    hex: "#A0522D" },
  { name: "Olive Brown",  hex: "#5C4A1E" },
  { name: "Forest Moss",  hex: "#4A5240" },
  { name: "Deep Teal",    hex: "#2C4A52" },
  { name: "Aubergine",    hex: "#4B2E3E" },
  { name: "Warm Taupe",   hex: "#8C7B6B" },
  { name: "Cream",        hex: "#E8DCC8" },
];

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
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem(DISPLAY_NAME_KEY) ?? ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const { theme, setTheme } = useTheme();

  // Keep draft in sync when sheet opens
  useEffect(() => {
    if (open) setDraft(displayName);
  }, [open, displayName]);

  const confirm = () => {
    const trimmed = draft.trim();
    setDisplayName(trimmed);
    localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(displayName);
    setIsEditing(false);
  };

  const previewInitials = getInitials(draft);
  const currentInitials = getInitials(displayName);

  return (
    <>
      {/* Avatar trigger in title row */}
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full glass border border-border/60 flex items-center justify-center text-sm font-semibold text-foreground shrink-0 active:scale-95 transition-transform duration-150"
        style={{ backgroundColor: "color-mix(in srgb, hsl(var(--background)) 60%, transparent)" }}
        aria-label="Open profile"
      >
        {currentInitials ? (
          <span className="text-[13px] font-semibold tracking-tight">{currentInitials}</span>
        ) : (
          <User size={17} strokeWidth={1.8} />
        )}
      </button>

      {/* Profile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-2xl px-4 pb-8 pt-5 space-y-6">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg font-semibold">Profile</SheetTitle>
          </SheetHeader>

          {/* ── Display Name ─────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-4">
              {/* Large avatar */}
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarFallback
                  className="text-xl font-semibold"
                  style={{
                    backgroundColor: "hsl(var(--gold))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  {isEditing
                    ? previewInitials || <User size={24} strokeWidth={1.8} />
                    : currentInitials || <User size={24} strokeWidth={1.8} />}
                </AvatarFallback>
              </Avatar>

              {/* Name display / edit */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value.slice(0, 32))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirm();
                        if (e.key === "Escape") cancel();
                      }}
                      placeholder="Your name"
                      className="h-9 text-base"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={confirm}>
                      <Check size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={cancel}>
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium truncate">
                      {displayName || <span className="text-muted-foreground">Add your name</span>}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                      onClick={() => {
                        setDraft(displayName);
                        setIsEditing(true);
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">Display name · max 32 characters</p>
              </div>
            </div>
          </section>

          {/* ── Theme ───────────────────────────────────────── */}
          <section className="space-y-2">
            <p className="text-sm font-medium">Appearance</p>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(val) => val && setTheme(val)}
              className="w-full gap-0 rounded-lg overflow-hidden border border-border"
            >
              {[
                { value: "system", label: "Auto" },
                { value: "light",  label: "Light" },
                { value: "dark",   label: "Dark" },
              ].map(({ value, label }, i, arr) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className={`flex-1 h-9 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-none ${
                    i === 0 ? "rounded-l-lg" : i === arr.length - 1 ? "rounded-r-lg" : ""
                  }`}
                >
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>

          {/* ── Capsule Wardrobe Palette ─────────────────────── */}
          <section className="space-y-2">
            <p
              className="text-xs font-semibold text-muted-foreground uppercase"
              style={{ letterSpacing: "0.07em" }}
            >
              Your Capsule Wardrobe Palette
            </p>
            <Card>
              <CardContent className="p-3 space-y-2.5">
                {PALETTE.map(({ name, hex }) => (
                  <div key={hex} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-md border border-border/50 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-sm font-medium flex-1">{name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{hex}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </SheetContent>
      </Sheet>
    </>
  );
}
