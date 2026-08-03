"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApiClient } from "@/lib/api-client";
import type { IDCardDetail } from "@/types/api";

/**
 * Halaman print bersama (dipakai staff MAUPUN portal, tidak perlu
 * versi terpisah -- backend yang tentukan boleh/tidaknya akses lewat
 * permission can_view_idcard, halaman ini sendiri cuma nampilkan
 * apa pun yang dibalikin API). CSS @page diset PRESIS ukuran kartu
 * (CR80: 54mm x 85.6mm, SAMA dgn CARD_SIZE di idcard/card_generator.py)
 * supaya kalau dicetak ke printer biasa dgn kertas PVC/card-stock siap
 * potong, hasilnya PAS -- bukan ke-scale otomatis mengikuti kertas A4.
 *
 * CATATAN: utk printer KARTU ID KHUSUS (Fargo/Zebra/Evolis dkk), print
 * via browser mungkin TIDAK optimal (printer2 itu biasanya py
 * software/driver SENDIRI yg menangani feed kartu fisik) -- utk kasus
 * itu, unduh gambar kartu (klik kanan > Save Image) & buka lewat
 * software printer tsb.
 */
export default function PrintIdCardPage() {
  const params = useParams();
  const { request } = useApiClient();
  const [card, setCard] = useState<IDCardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<IDCardDetail>(`/idcard/cards/${params.id}/`)
      .then(setCard)
      .catch(() => setError("Gagal memuat kartu."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function handleImageLoad() {
    // Beri jeda sedikit supaya browser SELESAI render gambar sebelum
    // dialog print muncul (kalau langsung, kadang gambar blank di preview print).
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
        {error && <p className="no-print" style={{ color: "red" }}>{error}</p>}
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
