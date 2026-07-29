import Link from "next/link";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "minute", label: "Menit Ini" },
  { value: "hour", label: "Jam Ini" },
  { value: "day", label: "Hari Ini" },
];

/** Filter waktu simpel (minute/hour/day) dipakai IMAP Logs & SASL Logs -- BEDA dari param _page/_limit dkk, ini spesifik ke 2 endpoint log auth-fail ini saja. */
export function TimeFilterLinks({ basePath, current }: { basePath: string; current: string }) {
  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={`${basePath}?time=${opt.value}`}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            current === opt.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
