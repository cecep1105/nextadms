/**
 * Utility pagination/sort/filter GENERIK -- versi TypeScript, dipakai
 * utk data yang diambil LANGSUNG oleh Next.js (BUKAN lewat Django), mis.
 * VMware Host/VM Guest (REST API vCenter langsung, lihat
 * src/lib/vsphere-client.ts) -- TIDAK ADA backend Django di antaranya
 * utk melakukan pagination/sort/filter, jadi dikerjakan di sini.
 *
 * SENGAJA disamakan PERSIS (nama param, bentuk output) dgn
 * netmgmt/list_utils.py (Django, dipakai Mikrotik/AD/Zentyal LDAP) --
 * supaya halaman VMware bisa pakai KOMPONEN UI YANG SAMA
 * (RouterOSSearchBar/RouterOSPaginationBar/RouterOSSortableHeader,
 * src/components/netmgmt/routeros-*.tsx) TANPA modifikasi apa pun --
 * komponen itu cuma baca/tulis URL param, tidak peduli data-nya
 * diproses Django atau di sini.
 *
 * Konvensi param (SAMA dgn Django): _page, _limit, _sort_by, _order
 * ("asc"|"desc"), _q, _search_fields.
 */

export interface ListParams {
  page: number;
  limit: number;
  sortBy: string;
  order: "asc" | "desc";
  searchQuery: string;
  searchFields: string[];
}

export interface PaginatedResult<T> {
  count: number;
  page: number;
  results: T[];
  next: number | null;
  previous: number | null;
}

/**
 * ⚠️ KOREKSI PENTING dari versi sebelumnya: fungsi ini SEBELUMNYA baca
 * param `_q`/`_page`/`_limit`/`_sort_by`/`_order` (meniru konvensi
 * INTERNAL yang dipakai Django::parse_list_params() saat MEMANGGIL API,
 * lihat netmgmt/list_utils.py) -- TERNYATA itu BUKAN nama param yang
 * ditulis komponen UI (RouterOSSearchBar/PaginationBar/SortableHeader/
 * PageSizeSelect) ke URL BROWSER. Komponen itu pakai nama BEDA:
 * `q`, `page`, `page_size`, `sortBy`, `sortDir` (TANPA underscore,
 * camelCase utk sort) -- akibatnya fungsi ini SEBELUMNYA SELALU balik ke
 * nilai default (klik apa pun di UI tidak berefek, krn param yg
 * di-baca TIDAK PERNAH match apa yg sungguh ada di URL) -- KETAHUAN
 * LANGSUNG dari laporan produksi ("search bar cuma loading, tidak
 * terfilter"), bukan asumsi. Halaman netmgmt LAIN yang datanya lewat
 * Django TIDAK kena bug ini krn PAGE.TSX-nya (bukan fungsi generik ini)
 * yang MELAKUKAN TERJEMAHAN param `q`/`page`/dst (dari URL) -> `_q`/
 * `_page`/dst (ke Django) secara manual -- fungsi INI (dipakai VMware,
 * TANPA Django di tengah) sekarang baca LANGSUNG nama param URL yg
 * BENAR, tidak perlu terjemahan krn tidak ada API Django yg dipanggil.
 */
export function parseListParams(
  searchParams: Record<string, string | string[] | undefined>,
  defaultSortBy = "name"
): ListParams {
  const get = (key: string): string => {
    const v = searchParams[key];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };
  return {
    page: parseInt(get("page"), 10) || 1,
    limit: parseInt(get("page_size"), 10) || 10,
    sortBy: get("sortBy") || defaultSortBy,
    order: get("sortDir") === "desc" ? "desc" : "asc",
    searchQuery: get("q").trim().toLowerCase(),
    searchFields: get("_search_fields").split(",").map((f) => f.trim()).filter(Boolean),
  };
}

/** Terima array MENTAH (semua baris, belum dipotong halaman), kembalikan bentuk siap-render -- SAMA PERSIS dgn Django::paginate_sort_filter(). */
export function paginateSortFilter<T extends object>(
  rows: T[],
  params: ListParams
): PaginatedResult<T> {
  // Cast internal ke Record<string, unknown> -- BUKAN membatasi tipe
  // input T (banyak interface data netmgmt spt VsphereHost/VsphereVm
  // TIDAK punya index signature literal, TypeScript menolak constraint
  // langsung ke Record<string, unknown> di level generic meski field-nya
  // cocok scr struktural) -- akses field via bracket notation TETAP
  // aman di runtime (field yang tidak ada cukup jadi undefined -> '').
  const getField = (item: T, field: string): unknown => (item as Record<string, unknown>)[field];

  let result = rows;

  if (params.searchQuery && params.searchFields.length > 0) {
    result = result.filter((item) =>
      params.searchFields.some((field) => String(getField(item, field) ?? "").toLowerCase().includes(params.searchQuery))
    );
  }

  result = [...result].sort((a, b) => {
    const av = String(getField(a, params.sortBy) ?? "");
    const bv = String(getField(b, params.sortBy) ?? "");
    const cmp = av.localeCompare(bv, undefined, { numeric: true });
    return params.order === "desc" ? -cmp : cmp;
  });

  const start = (params.page - 1) * params.limit;
  const paginated = result.slice(start, start + params.limit);

  return {
    count: result.length,
    page: params.page,
    results: paginated,
    next: start + params.limit < result.length ? params.page + 1 : null,
    previous: params.page > 1 ? params.page - 1 : null,
  };
}