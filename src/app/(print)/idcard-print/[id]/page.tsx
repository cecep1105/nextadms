"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApiClient } from "@/lib/api-client";
import { extractErrorMessage } from "@/lib/error-utils";
import type { IDCardDetail } from "@/types/api";
import styles from "./print.module.css";

/**
 * Halaman print bersama (dipakai staff MAUPUN portal -- lihat
 * src/middleware.ts::IDCARD_PRINT_PREFIX, wajib dikecualikan di sana
 * juga supaya user portal TIDAK ke-redirect balik ke /portal saat
 * coba akses halaman ini). CSS @page diset PRESIS ukuran kartu (CR80:
 * 54mm x 85.6mm, SAMA dgn CARD_SIZE di idcard/card_generator.py) --
 * SEMUA styling lewat CSS Module (print.module.css), BUKAN raw
 * <style> string (lihat catatan lengkap kenapa di file CSS itu --
 * ringkasnya: raw <style> string di JSX bikin Hydration Error).
 *
 * BUG LAIN YANG SUDAH DIPERBAIKI: percobaan pertama halaman ini
 * memanggil request() di dalam useEffect dgn dependency array HANYA
 * [params.id] -- TIDAK menyertakan `request` itu sendiri. Karena
 * useApiClient() butuh sesi NextAuth (useSession()) buat lampirkan
 * Bearer token, & sesi itu BARU selesai dimuat SETELAH render pertama
 * (asynchronous), `request` yang di-capture closure effect itu MASIH
 * versi TANPA token -- API call SELALU gagal & effect TIDAK PERNAH
 * dicoba ulang stlh token sungguh tersedia.
 *
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
    <div className={styles.printWrapper}>
      {status !== "authenticated" && !error && <p className={`${styles.noPrint} ${styles.statusText}`}>Memuat sesi...</p>}
      {error && <p className={`${styles.noPrint} ${styles.errorText}`}>{error}</p>}
      {card && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.printCardImg} src={card.card_image} alt={card.holder_name} onLoad={handleImageLoad} />
          <p className={`${styles.noPrint} ${styles.hint}`}>
            Dialog cetak akan muncul otomatis. Untuk printer kartu ID khusus (Fargo/Zebra/dll), unduh gambar ini (klik kanan → Save Image As) dan buka lewat software printer tersebut untuk hasil terbaik.
          </p>
        </>
      )}
    </div>
  );
}
