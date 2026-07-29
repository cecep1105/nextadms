/**
 * Format ISO datetime string jadi waktu relatif ("2 menit lalu", "3 jam
 * lalu", dst) -- dependency-free (tanpa date-fns/dayjs), cukup utk
 * kebutuhan simpel spt ini.
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "-";

  const diffSeconds = Math.round((Date.now() - then) / 1000);
  if (diffSeconds < 0) return "baru saja";
  if (diffSeconds < 60) return "baru saja";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} hari lalu`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} bulan lalu`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} tahun lalu`;
}
