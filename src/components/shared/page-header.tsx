import { InteractiveBreadcrumb } from "@/components/layout/interactive-breadcrumb";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="sticky top-12 bg-card/95 z-10 mb-4 p-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {/* <h1 className="font-medium text-lg font-semibold tracking-tight">{title}</h1> */}
        <InteractiveBreadcrumb topbar={false} />
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
