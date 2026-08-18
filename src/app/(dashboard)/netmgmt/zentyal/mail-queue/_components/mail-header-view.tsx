"use client";

import { Mail, X } from 'lucide-react'
import { useState, useRef, useMemo, useEffect } from 'react';
import { Button} from "@/components/ui/button";

import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from '@/lib/error-utils';

interface MailHeader {
  name: string
  value: string
}

interface QHeaderResponse {
  result: string[]
}


export function MailHeaderView({qid}:{ qid: string}) {
  const [open, setOpen] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState({ x: 24, y: 90 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const { request } = useApiClient();

  const headers = useMemo(
    () => parseHeaders(rawHeaders),
    [rawHeaders]
  )

  function handleDragStart(e: React.MouseEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  }

  function handleDragMove(e: MouseEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: Math.max(0, dragRef.current.originX + dx),
      y: Math.max(0, dragRef.current.originY + dy),
    });
  }
 
  function handleDragEnd() {
    dragRef.current = null;
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  }

  function parseHeaders(lines: string[]): MailHeader[] {
    const headers: MailHeader[] = []

    for (const line of lines) {
      // Continuation line
      if (/^[\t ]/.test(line) && headers.length > 0) {
        headers[headers.length - 1].value += ` ${line.trim()}`
        continue
      }

      const separator = line.indexOf(":")

      if (separator === -1) {
        continue
      }

      headers.push({
        name: line.slice(0, separator).trim(),
        value: line.slice(separator + 1).trim(),
      })
    }

    return headers
  }

  async function loadMailHeaders() {
    setLoading(true)
    setError(null)

    try {
      const data = await request<QHeaderResponse>(`/netmgmt/zentyal-mail/qheader/?qid=${qid}`)
      setRawHeaders(data.result)
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "Gagal mengambil header email."
        )
      )
    } finally {
      setLoading(false)
    }
  }



  // Bersihkan listener drag kalau komponen unmount di tengah drag (jarang, tapi jaga-jaga).
  useEffect(() => () => {
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      loadMailHeaders();
    }
  }, [open])


  if (!open) {
    return (
      <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
        <Mail className="pl-1 h-2.5 w-2.5" />
      </Button>
    );
  }

  return (
    <div
      className="fixed z-50 w-[40rem] overflow-hidden rounded-lg border border-border shadow-2xl"
      style={{ left: position.x, top: position.y }}
    >
      <div
        onMouseDown={handleDragStart}
        className="flex cursor-move select-none items-center justify-between bg-secondary px-3 py-2"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium">
          <Mail className="h-3.5 w-3.5" /> Mail Header {qid}
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)} aria-label="Tutup console">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="h-96 space-y-0.5 overflow-y-auto bg-black p-3  text-[8px] text-emerald-400">
        <div className="space-y-2 text-sm">
          { headers.map((header) => (
          <div
            className="grid grid-cols-[120px_1fr] gap-3"
          >
            <span className="font-medium text-muted-foreground">
              { header.name }:
            </span>
            <span className="min-w-0 break-words text-xs">
              { header.value }
            </span>
          </div>
          ))}
        </div>
      </div>
    </div>
  );
}