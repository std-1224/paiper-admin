import { ReactNode } from "react";
// import { Button } from "@/components/ui/button";
// import { SidebarTrigger } from "@/components/ui/sidebar";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  breadcrumb?: ReactNode;
}

export function PageHeader({
  title,
  description,
  children,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6">
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-4">
          {/* <SidebarTrigger className="sm:hidden" /> */}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {breadcrumb && <div className="mt-1">{breadcrumb}</div>}
      </div>
      {children && (
        <div className="mt-4 sm:mt-0 w-full sm:w-auto flex flex-wrap gap-2 justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
