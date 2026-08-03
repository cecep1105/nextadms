"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { IDCardDetail } from "@/types/api";

/**
 * Halaman print bersama (dipakai staff MAUPUN portal). CSS @page diset
 * PRESIS ukuran kartu (CR80: 54mm x 85.6mm, SAMA dgn CARD_SIZE di
 * idcard/card_generator.py).
 *
 * BUG YANG SUDAH DIPERBAIKI: percobaan pertama halaman ini memanggil
 * request() di dalam useEffect dgn dependency array HANYA [params.id]
 * -- TIDAK menyertakan `request` itu sendiri. Karena useApiClient()
 * butuh sesi NextAuth (useSession()) buat lampirkan Bearer token, & sesi
 * itu BARU selesai dimuat SETELAH render pertama (asynchronous),
 * `request` yang di-capture closure effect itu MASIH versi TANPA token
 * -- API call SELALU gagal (401/403) & effect TIDAK PERNAH dicoba ulang
 * stlh token sungguh tersedia. Pola ini BARU muncul di sini -- di
 * tempat lain, useApiClient() SELALU dipanggil dari handler klik
 * (submit form, dst), yaitu SETELAH halaman sudah lama termuat, jadi
 * masalah race condition ini tidak pernah ketahuan sebelumnya.

 * FIX: tunggu status === 'authenticated' dulu SEBELUM fetch, & sertakan
 * `request` di dependency array supaya effect dicoba ulang begitu
 * token sungguh tersedia.
 */
export default function PrintIdCardPage() {
  const params = useParams();
  const { status } = useSession();
  const { request } = useApiClient();
  const [card, setCard] = useState<IDCardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return; // tunggu sesi selesai dimuat -- JANGAN fetch dgn token yg belum ada
    request<IDCardDetail>(`/idcard/cards/${params.id}/`)
      .then(setCard)
      .catch((err) => setError(extractErrorMessage(err, "Gagal memuat kartu.")));
  }, [params.id, status, request]);

  function handleImageLoad() {
    setTimeout(() => window.print(), 150);
  }

  return (
    <>
      <style>{`
        @page { size: 54mm 85.6mm; margin: 0; }
        @media print {
          body { margin: 0; }
          #print-card-img { width: 54mm; height: 85.6mm; display: block; }
          .no-print { display: none; }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#e5e5e5", padding: 16 }}>
        {status !== "authenticated" && !error && <p className="no-print" style={{ color: "#555" }}>Memuat sesi...</p>}
        {error && <p className="no-print" style={{ color: "red", maxWidth: 320, textAlign: "center" }}>{error}</p>}
        {card && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img id="print-card-img" src={card.card_image} alt={card.holder_name} onLoad={handleImageLoad} style={{ maxWidth: 320, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} />
            <p className="no-print" style={{ marginTop: 12, fontSize: 12, color: "#555", textAlign: "center", maxWidth: 320 }}>
              Dialog cetak akan muncul otomatis. Untuk printer kartu ID khusus (Fargo/Zebra/dll), unduh gambar ini (klik kanan → Save Image As) dan buka lewat software printer tersebut untuk hasil terbaik.
            </p>
          </>
        )}
      </div>
    </>
  );
}
