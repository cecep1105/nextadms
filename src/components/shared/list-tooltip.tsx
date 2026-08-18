import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
export function ListTooltip({
  items,
}: {
  items: string[]
}) {
  if (items.length === 0) {
    return (
      <span className="text-muted-foreground">
        -
      </span>
    )
  }

  if (items.length === 1) {
    return (
      <span className="text-muted-foreground">
        {items[0] || "-"}
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help hover:bg-yellow-100 hover:text-black">
          {items[0]} + {items.length - 1} lainnya
        </span>
      </TooltipTrigger>
        <TooltipContent className="bg-yellow-100" side="left">
            <div className="max-h-60 max-w-md space-y-1 overflow-y-auto text-foreground">
            {items.map((item, index) => (
                <p
                key={`${item}-${index}`}
                className="break-all text-xs dark:text-black"
                >
                {item}
                </p>
            ))}
            </div>
        </TooltipContent>
    </Tooltip>
  )
}