"use client";

import type { Column, Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import * as React from "react";

import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableFilterListProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
}

export function DataTableFilterList<TData>({
  table,
  className,
  ...props
}: DataTableFilterListProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  return (
    <div className={cn("flex flex-1 flex-wrap items-center gap-2", className)} {...props}>
      {columns.map((column) => (
        <DataTableFilterControl key={column.id} column={column} />
      ))}
      {isFiltered && (
        <Button
          aria-label="Effacer les filtres"
          variant="outline"
          size="sm"
          className="border-dashed"
          onClick={() => table.resetColumnFilters()}
        >
          <X />
          Effacer
        </Button>
      )}
    </div>
  );
}

function DataTableFilterControl<TData>({ column }: { column: Column<TData> }) {
  const columnMeta = column.columnDef.meta;
  if (!columnMeta?.variant) return null;

  if (columnMeta.variant === "text") {
    return (
      <Input
        placeholder={columnMeta.placeholder ?? columnMeta.label}
        value={(column.getFilterValue() as string) ?? ""}
        onChange={(event) => column.setFilterValue(event.target.value)}
        className="h-8 w-56"
      />
    );
  }

  if (columnMeta.variant === "select" || columnMeta.variant === "multiSelect") {
    return (
      <DataTableFacetedFilter
        column={column}
        title={columnMeta.label ?? column.id}
        options={columnMeta.options ?? []}
        multiple={columnMeta.variant === "multiSelect"}
      />
    );
  }

  return null;
}
