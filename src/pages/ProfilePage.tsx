import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Pencil, Check, X, User, LogOut, Plus, Trash2, ChevronRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import BrandManagerSheet from "@/components/BrandManagerSheet";
import { usePaletteContext } from "@/contexts/PaletteContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SEASONAL_PALETTES, hexToColorName } from "@/data/seasonal-palettes";

function displayNameKey(userId: string) {
  return `capsule-display-name-${userId}`;
}

// Normalise a single hex token — handles "#abc", "abc", "#aabbcc", "aabbcc"
function normaliseHex(raw: string): string | null {
  const s = raw.trim().replace(/^#/, "");
  if (s.length === 3) return "#" + s.split("").map((c) => c + c).join("");
  if (s.length === 6) return "#" + s;
  return null;
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { wardrobeItems, refreshWardrobe } = useAppData();
  const { theme, setTheme } = useTheme();

  const brandList = useMemo(() => {
    const seen = new Set<string>();
    wardrobeItems.forEach((item) => { if (item.brand) seen.add(item.brand); });
    return Array.from(seen).sort();
  }, [wardrobeItems]);
  const [brandManagerOpen, setBrandManagerOpen] = useState(false);
  const { palette, seasonalType, addColor, addColors, removeColor, updateColor, selectSeasonalType } = usePaletteContext();

  // ── Display name ────────────────────────────────────────────
  const nameKey = user ? displayNameKey(user.id) : null;
  const [displayName, setDisplayName] = useState(
    () => (nameKey ? localStorage.getItem(nameKey) ?? "" : "")
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);

  const confirmName = () => {
    const trimmed = nameDraft.trim();
    setDisplayName(trimmed);
    if (nameKey) localStorage.setItem(nameKey, trimmed);
    setIsEditingName(false);
  };
  const cancelName = () => { setNameDraft(displayName); setIsEditingName(false); };

  // ── Zip code ─────────────────────────────────────────────────
  const zipKey = user ? `capsule-zip-${user.id}` : "capsule-zip";
  const [zipCode, setZipCode] = useState(
    () => (user ? localStorage.getItem(`capsule-zip-${user.id}`) : null) ?? ""
  );
  const [isEditingZip, setIsEditingZip] = useState(false);
  const [zipDraft, setZipDraft] = useState(zipCode);

  const confirmZip = () => {
    const trimmed = zipDraft.trim();
    setZipCode(trimmed);
    localStorage.setItem(zipKey, trimmed);
    setIsEditingZip(false);
  };
  const cancelZip = () => { setZipDraft(zipCode); setIsEditingZip(false); };

  // ── Seasonal type drawer ──────────────────────────────────────
  const [seasonalDrawerOpen, setSeasonalDrawerOpen] = useState(false);

  const handleSelectSeasonal = async (typeId: string) => {
    setSeasonalDrawerOpen(false);
    await selectSeasonalType(typeId);
  };

  const currentSeasonal = SEASONAL_PALETTES.find((p) => p.id === seasonalType);

  // ── Palette editor ───────────────────────────────────────────
  const [newInput, setNewInput] = useState("");
  const [pickerHex, setPickerHex] = useState("#8B3A2A");
  const [editingHex, setEditingHex] = useState<string | null>(null);
  const [editHexDraft, setEditHexDraft] = useState("");
  const [editNameDraft, setEditNameDraft] = useState("");
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handlePickerChange = (hex: string) => {
    setPickerHex(hex);
    setNewInput(hex);
  };

  const handleAdd = async () => {
    const tokens = newInput.split(",").map((t) => t.trim()).filter(Boolean);
    const valid = tokens.map(normaliseHex).filter((h): h is string => h !== null);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      await addColor(valid[0], hexToColorName(valid[0]));
    } else {
      await addColors(valid.map((hex) => ({ hex, name: hexToColorName(hex) })));
    }
    setNewInput("");
    setPickerHex("#8B3A2A");
  };

  const startEdit = (hex: string, name: string) => {
    setEditingHex(hex);
    setEditHexDraft(hex);
    setEditNameDraft(name);
  };

  const confirmEdit = async () => {
    if (!editingHex) return;
    await updateColor(editingHex, editHexDraft, editNameDraft);
    setEditingHex(null);
  };

  const cancelEdit = () => setEditingHex(null);

  const previewInitials = getInitials(nameDraft);
  const currentInitials = getInitials(displayName);

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="max-w-lg mx-auto px-4 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between py-5">
          <h1 className="text-lg font-semibold">Profile</h1>
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Close profile"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          {/* ── Display Name ─────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarFallback
                  className="text-xl font-semibold"
                  style={{
                    backgroundColor: "hsl(var(--gold))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  {isEditingName
                    ? previewInitials || <User size={24} strokeWidth={1.8} />
                    : currentInitials || <User size={24} strokeWidth={1.8} />}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value.slice(0, 32))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmName();
                        if (e.key === "Escape") cancelName();
                      }}
                      placeholder="Your name"
                      className="h-9 text-base"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={confirmName}>
                      <Check size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={cancelName}>
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
                      onClick={() => { setNameDraft(displayName); setIsEditingName(true); }}
                    >
                      <Pencil size={14} />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">Display name · max 32 characters</p>
              </div>
            </div>
          </section>

          {/* ── Zip Code ─────────────────────────────────────── */}
          <section className="space-y-2">
            <p className="text-sm font-medium">Zip Code</p>
            {isEditingZip ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={zipDraft}
                  onChange={(e) => setZipDraft(e.target.value.slice(0, 10))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmZip();
                    if (e.key === "Escape") cancelZip();
                  }}
                  placeholder="e.g. 90210"
                  className="h-9"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={confirmZip}>
                  <Check size={16} />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={cancelZip}>
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {zipCode || <span className="text-muted-foreground">Not set · auto-filled on first Planner visit</span>}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground"
                  onClick={() => { setZipDraft(zipCode); setIsEditingZip(true); }}
                >
                  <Pencil size={14} />
                </Button>
              </div>
            )}
          </section>

          {/* ── Appearance ───────────────────────────────────── */}
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

          {/* ── Seasonal Type ─────────────────────────────────── */}
          <section className="space-y-2">
            <p className="text-sm font-medium">Seasonal Type</p>
            <button
              onClick={() => setSeasonalDrawerOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/60 liquid-glass-surface active:opacity-80 transition-opacity text-left"
            >
              <div className="min-w-0">
                {currentSeasonal ? (
                  <>
                    <span className="text-sm font-medium">{currentSeasonal.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{currentSeasonal.descriptor}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Not selected</span>
                )}
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" />
            </button>
          </section>

          {/* ── Brands ───────────────────────────────────────── */}
          <section className="space-y-2">
            <p className="text-sm font-medium">Brands</p>
            <button
              onClick={() => setBrandManagerOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-border/60 liquid-glass-surface active:opacity-80 transition-opacity text-left"
            >
              <span className="text-sm text-muted-foreground">
                {brandList.length} brand{brandList.length !== 1 ? "s" : ""} in your wardrobe
              </span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" />
            </button>
          </section>

          {/* ── Palette Editor ───────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-semibold text-muted-foreground uppercase"
                style={{ letterSpacing: "0.07em" }}
              >
                Your Palette
              </p>
              <span className="text-xs text-muted-foreground">{palette.length} colors</span>
            </div>

            {/* Existing colors */}
            <div className="space-y-1.5">
              {palette.map(({ name, hex }) => (
                <div key={hex} className="flex items-center gap-2.5">
                  {editingHex === hex ? (
                    <>
                      <input
                        type="color"
                        value={editHexDraft}
                        onChange={(e) => setEditHexDraft(e.target.value)}
                        className="w-8 h-8 rounded-md border border-border cursor-pointer shrink-0"
                      />
                      <Input
                        value={editNameDraft}
                        onChange={(e) => setEditNameDraft(e.target.value.slice(0, 32))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        placeholder="Color name"
                        className="h-8 text-sm flex-1"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={confirmEdit}>
                        <Check size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEdit}>
                        <X size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-8 h-8 rounded-md border border-border/50 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-sm font-medium flex-1 truncate">{name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{hex}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground"
                        onClick={() => startEdit(hex, name)}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground"
                        onClick={() => removeColor(hex)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add new color */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                ref={colorInputRef}
                type="color"
                value={pickerHex}
                onChange={(e) => handlePickerChange(e.target.value)}
                className="w-8 h-8 rounded-md border border-border cursor-pointer shrink-0"
              />
              <Input
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                placeholder="#hex or #a1b2c3, #d4e5f6, …"
                className="h-8 text-sm flex-1 font-mono"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={handleAdd}
              >
                <Plus size={15} />
              </Button>
            </div>
          </section>

          {/* ── Sign Out ─────────────────────────────────────── */}
          <section className="pt-2">
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={async () => { await signOut(); }}
            >
              <LogOut size={16} />
              Sign out
            </Button>
          </section>
        </div>
      </div>

      {/* ── Brand Manager Drawer ─────────────────────────────── */}
      <BrandManagerSheet
        open={brandManagerOpen}
        onOpenChange={setBrandManagerOpen}
        brands={brandList}
        onRenameComplete={refreshWardrobe}
      />

      {/* ── Seasonal Type Drawer ──────────────────────────────── */}
      <Drawer open={seasonalDrawerOpen} onOpenChange={setSeasonalDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2 shrink-0">
            <DrawerTitle>Seasonal Type</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8 space-y-1">
            {SEASONAL_PALETTES.map((sp) => {
              const isSelected = seasonalType === sp.id;
              return (
                <button
                  key={sp.id}
                  onClick={() => handleSelectSeasonal(sp.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-muted/60"
                  }`}
                >
                  {/* Color swatches */}
                  <div className="flex gap-1 shrink-0">
                    {sp.colors.map((c) => (
                      <div
                        key={c.hex}
                        className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>

                  {/* Name + descriptor */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{sp.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">{sp.descriptor}</p>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <CheckCircle2 size={18} className="text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
