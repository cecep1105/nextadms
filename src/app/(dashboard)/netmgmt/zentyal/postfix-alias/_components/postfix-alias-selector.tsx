"use client"

import { useRouter, useSearchParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PostfixAliasSelectorProps {
  current: string
  sources: string[]
}

export function PostfixAliasSelector({
  current,
  sources,
}: PostfixAliasSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(slug: string) {
    const params = new URLSearchParams(searchParams.toString())

    params.set("source", slug)
    params.delete("page")
    params.delete("q")

    router.push(`?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Pilih nama alias" />
      </SelectTrigger>

      <SelectContent>
        {sources.map((source) => (
          <SelectItem key={source} value={source}>
            {source}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}