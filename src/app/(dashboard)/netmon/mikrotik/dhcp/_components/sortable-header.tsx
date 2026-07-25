'use client';

import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function SortableHeader({ label,  sortKey,  currentSort, basePath, searchParams}: {label: string; sortKey: string; currentSort: string; basePath: string;   searchParams: Record<string, string | undefined>;}) {
     
  const router = useRouter();
  const pathname = usePathname();

const isActive = currentSort === sortKey || currentSort === `-${sortKey}`;
  const isDesc = currentSort === `-${sortKey}`;
  const handleSort = (nextSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('_order', nextSort);
    params.set('_orderby', sortKey)
    
    // Push new route to trigger server component re-fetch


    alert(`${pathname}?${params.toString()}`);

    router.push(`${pathname}?${params.toString()}`);
  };


  const nextOrder = currentSort === 'asc' ? 'desc' : 'asc';

  return (
    <Link href='#' className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort(nextOrder)}>
      {label}
      {isActive ? (
        isDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" />
      )}
    </Link>
  );
}
