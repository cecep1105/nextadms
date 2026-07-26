// components/SortableHeader.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface SortableHeaderProps {
  columnKey: string;
  label: string;
}

export default function SortableHeader({ columnKey, label }: SortableHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sortBy');
  const currentDir = searchParams.get('sortDir');

  const handleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Toggle logic: asc -> desc -> remove sort
    if (currentSort === columnKey && currentDir === 'asc') {
      params.set('sortDir', 'desc');
    } else if (currentSort === columnKey && currentDir === 'desc') {
      params.delete('sortBy');
      params.delete('sortDir');
    } else {
      params.set('sortBy', columnKey);
      params.set('sortDir', 'asc');
    }

    // Pushes the new URL, triggering a Server Component re-render
    router.push(`${pathname}?${params.toString()}`);
  };

  const getSortIndicator = () => {
    if (currentSort !== columnKey) return '↕️';
    return currentDir === 'asc' ? '🔼' : '🔽';
  };

  return (
    <th 
      onClick={handleSort} 
      className="cursor-pointer select-none p-4 text-left font-semibold border-b hover:bg-gray-100"
    >
      <div className="flex items-center gap-2">
        {label}
        <span className="text-xs text-gray-500">{getSortIndicator()}</span>
      </div>
    </th>
  );
}
