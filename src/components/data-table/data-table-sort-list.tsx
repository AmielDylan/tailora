"use client";

import type { Table } from "@tanstack/react-table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableSortListProps<TData> {
  table: Table<TData>;
  options: {
    label: string;
    value: string;
    sorting: { id: string; desc: boolean }[];
  }[];
}

export function DataTableSortList<TData>({
  table,
  options,
}: DataTableSortListProps<TData>) {
  const current = JSON.stringify(table.getState().sorting);
  const currentOption = options.find((option) => JSON.stringify(option.sorting) === current);

  return (
    <Select
      value={currentOption?.value}
      onValueChange={(value) => {
        const option = options.find((item) => item.value === value);
        if (option) table.setSorting(option.sorting);
      }}
    >
      <SelectTrigger className="h-8 w-[190px] bg-background">
        <SelectValue placeholder="Trier" />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
