"use client";
import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupMembersDialog } from "./group-members-dialog";

export function ManageMembersButton({
  source, groupDn, groupName,
}: {
  source: "ad" | "zentyal";
  groupDn: string;
  groupName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Users className="h-2.5 w-2.5" /> Kelola Member
      </Button>
      <GroupMembersDialog source={source} groupDn={groupDn} groupName={groupName} open={open} onOpenChange={setOpen} />
    </>
  );
}
