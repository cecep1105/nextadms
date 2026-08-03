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

        .print-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #e5e5e5;
          padding: 16px;
        }
        .print-card-img {
          max-width: 320px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        /*
         * ⚠️ BUG YANG SUDAH DIPERBAIKI (halaman kosong 3 lembar, kartu
         * cuma muncul di lembar tengah): SEBELUMNYA style kontainer di
         * atas (minHeight:100vh, flex-centering, padding) ditulis lewat
         * inline style React (style={{...}}), BUKAN class CSS -- inline
         * style TIDAK BISA di-override oleh @media print sama sekali
         * (specificity-nya SELALU menang drpd aturan stylesheet apa
         * pun). Akibatnya, minHeight:100vh (TETAP mengacu ke tinggi
         * viewport LAYAR, ~800-1000px, BUKAN ukuran @page 85.6mm) tetap
         * aktif saat print, bikin browser MEMECAH 1 kontainer super
         * tinggi itu jadi 3 halaman fisik: bagian ATAS kontainer (kosong,
         * sebelum konten yg di-center) -> lembar 1, bagian TENGAH (gambar
         * kartu yg di-center) -> lembar 2, bagian BAWAH (kosong lagi)
         * -> lembar 3.
         *
         * FIX: pindahkan SEMUA style yg perlu beda antara layar vs print
         * ke CLASS CSS (bukan inline style), supaya blok @media print
         * DI BAWAH ini bisa benar2 menimpanya -- kontainer jadi block
         * biasa (tanpa minHeight/flex/padding) saat print, gambar PAS 1
         * halaman penuh (54mm x 85.6mm), TIDAK ada elemen lain yg bikin
         * tinggi dokumen melebihi 1 halaman.
         */
        @media print {
          body { margin: 0; }
          .print-wrapper {
            display: block;
            min-height: 0;
            height: auto;
            padding: 0;
            background: none;
          }
          .print-card-img {
            width: 54mm;
            height: 85.6mm;
            max-width: none;
            box-shadow: none;
            display: block;
          }
          .no-print { display: none; }
        }
      `}</style>
      <div className="print-wrapper">
        {status !== "authenticated" && !error && <p className="no-print" style={{ color: "#555" }}>Memuat sesi...</p>}
        {error && <p className="no-print" style={{ color: "red", maxWidth: 320, textAlign: "center" }}>{error}</p>}
        {card && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="print-card-img" src={card.card_image} alt={card.holder_name} onLoad={handleImageLoad} />
            <p className="no-print" style={{ marginTop: 12, fontSize: 12, color: "#555", textAlign: "center", maxWidth: 320 }}>
              Dialog cetak akan muncul otomatis. Untuk printer kartu ID khusus (Fargo/Zebra/dll), unduh gambar ini (klik kanan → Save Image As) dan buka lewat software printer tersebut untuk hasil terbaik.
            </p>
          </>
        )}
      </div>
    </>
  );
}
