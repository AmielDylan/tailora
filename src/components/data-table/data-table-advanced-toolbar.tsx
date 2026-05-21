"use client";

import type { Table } from "@tanstack/react-table";
import type * as React from "react";

import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { cn } from "@/lib/utils";

interface DataTableAdvancedToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
}

export function DataTableAdvancedToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableAdvancedToolbarProps<TData>) {
  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn("flex w-full flex-col gap-2 p-1 lg:flex-row lg:items-center lg:justify-between", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      <DataTableViewOptions table={table} align="end" />
    </div>
  );
}
