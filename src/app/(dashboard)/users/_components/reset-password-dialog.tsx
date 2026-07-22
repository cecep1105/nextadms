"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useApiClient } from "@/lib/api-client";

export function ResetPasswordDialog({ userId, username }: { userId: number; username: string }) {
  const router = useRouter();
  const { request } = useApiClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setNewPassword("");
      setGeneratedPassword(null);
      setCopied(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await request<{ detail: string; generated_password?: string }>(
        `/users/${userId}/reset-password/`,
        { method: "POST", body: JSON.stringify({ new_password: newPassword || undefined }) }
      );
      if (result.generated_password) {
        setGeneratedPassword(result.generated_password);
      } else {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function copyPassword() {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Reset password">
        <KeyRound className="h-3.5 w-3.5" />
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password — {username}</DialogTitle>
          <DialogDescription>
            Isi password baru, atau kosongkan untuk generate otomatis.
          </DialogDescription>
        </DialogHeader>

        {generatedPassword ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Password baru berhasil di-generate -- catat sekarang, tidak akan ditampilkan lagi:
            </p>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
              <code className="flex-1 font-mono text-sm">{generatedPassword}</code>
              <Button type="button" variant="ghost" size="icon" onClick={copyPassword}>
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => { setOpen(false); router.refresh(); }}>Selesai</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newpw">Password Baru (opsional)</Label>
              <Input id="newpw" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Kosongkan untuk auto-generate" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Reset</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
