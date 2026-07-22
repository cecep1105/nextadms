"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fingerprint, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Fingerprint className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">404 — Halaman tidak ditemukan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Halaman Sebelumnya
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="h-3.5 w-3.5" /> Ke Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
