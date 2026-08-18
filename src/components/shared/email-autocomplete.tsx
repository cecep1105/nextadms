'use client';

import * as React from 'react';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { useApiClient } from "@/lib/api-client";
import type { DirectoryUser } from "@/types/api";

  const { request } = useApiClient();

export function EmailAutocomplete({ value, source, onChange }: { value: string; source: "ad" | "zentyal"; onChange: (val: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<DirectoryUser[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Debounce effect to query LDAP API
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await request<{ results: DirectoryUser[] }>(
          `/netmgmt/${source}/users/?_q=${encodeURIComponent(value)}&_search_fields=username,display_name,email&_limit=8`
        );

        setSuggestions(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || 'Type email or name...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search LDAP..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value); // Allow free typing too
              if (!open) setOpen(true);
            }}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching LDAP...
              </div>
            )}
            <CommandEmpty>No matching directory user found.</CommandEmpty>
            <CommandGroup>
              {suggestions.map((user) => (
                <CommandItem
                  key={user.email}
                  value={user.email}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span>{user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
