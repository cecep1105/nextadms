/**
 * Layout KHUSUS route (print) -- SENGAJA cuma render {children} apa
 * adanya, TANPA sidebar/header dashboard maupun portal (keduanya cuma
 * bikin ribut saat dicetak, & ukuran kertas jadi tidak presisi kalau
 * chrome itu ikut ke-render). Tetap dibungkus root layout
 * (src/app/layout.tsx, cuma Providers + font, tidak ada chrome visual)
 * supaya session/auth (dipakai useApiClient di halaman print) tetap
 * berfungsi normal.
 */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
