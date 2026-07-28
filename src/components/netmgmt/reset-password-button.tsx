"use client";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResetPasswordDialog } from "./reset-password-dialog";

export function ResetPasswordButton({
  source, userDn, userLabel,
}: {
  source: "ad" | "zentyal";
  userDn: string;
  userLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Reset Password">
        <KeyRound className="h-3.5 w-3.5" />
      </Button>
      <ResetPasswordDialog source={source} userDn={userDn} userLabel={userLabel} open={open} onOpenChange={setOpen} />
    </>
  );
}
