"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: React.ReactNode;
  className?: string;
  cell?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowClassName?: (row: T) => string | undefined;
  renderActions?: (row: T) => React.ReactNode;
  page?: number;
  totalPages?: number;
  total?: number;
  showingCount?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
};

export function DataTable<T extends { [key: string]: any }>({
  columns,
  data,
  getRowClassName,
  renderActions,
  page = 1,
  totalPages = 1,
  total = data.length,
  showingCount = data.length,
  onPageChange,
  isLoading = false,
}: DataTableProps<T>) {
  const renderPagination = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    let pages: (number | string)[] = [];

    if (page <= 2) {
      pages = [1, 2, 3, "...", totalPages];
    } else if (page === 3) {
      pages = [1, 2, 3, 4, "...", totalPages];
    } else if (page >= totalPages - 1) {
      pages = [1, "...", totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, "...", page - 1, page, page + 1, "...", totalPages];
    }

    return pages;
  };

  // Skeleton loader for table rows
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <TableRow
        key={`skeleton-${idx}`}
        className="shadow-md rounded-lg animate-pulse"
      >
        {columns.map((col) => (
          <TableCell
            key={String(col.key)}
            className={
              "text-xs sm:text-sm whitespace-nowrap font-medium py-4 first:rounded-l-lg last:rounded-r-lg overflow-hidden bg-gray-200 " +
              (col.className ?? "")
            }
          >
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </TableCell>
        ))}
        {renderActions && (
          <TableCell
            className={
              "text-xs sm:text-sm whitespace-nowrap font-medium py-4 last:rounded-r-lg overflow-hidden bg-gray-200"
            }
          >
            <div className="flex gap-1 sm:gap-2">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
            </div>
          </TableCell>
        )}
      </TableRow>
    ));
  };

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 bg-background px-5 py-7 rounded-md">
      <div className="inline-block min-w-full px-4 sm:px-0">
        <Table className="border-separate border-spacing-y-4 border-spacing-x-0">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={
                    "whitespace-nowrap text-xs sm:text-sm font-semibold" +
                    (col.className ?? "")
                  }
                >
                  {col.header}
                </TableHead>
              ))}
              {renderActions && (
                <TableHead className="whitespace-nowrap text-xs sm:text-sm font-semibold">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? renderSkeletonRows()
              : data.map((row, idx) => (
                  <TableRow
                    className="shadow-md rounded-lg"
                    key={(row as any).id ?? idx}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={String(col.key)}
                        className={
                          "text-xs sm:text-sm whitespace-nowrap font-medium py-4 first:rounded-l-lg last:rounded-r-lg overflow-hidden " +
                          (getRowClassName?.(row) ?? "") +
                          " " +
                          (col.className ?? "")
                        }
                      >
                        {col.cell
                          ? col.cell(row)
                          : String(row[col.key as keyof T] || "-")}
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell
                        className={
                          "text-xs sm:text-sm whitespace-nowrap font-medium py-4 last:rounded-r-lg overflow-hidden " +
                          (getRowClassName?.(row) ?? "")
                        }
                      >
                        {renderActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <span className="text-xs sm:text-sm text-muted-foreground">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading data...
            </div>
          ) : (
            `Showing ${showingCount} from ${total} data`
          )}
        </span>

        <div className="flex gap-1 flex-wrap justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            className="text-xs sm:text-sm bg-transparent"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
          >
            ←
          </Button>

          {renderPagination().map((p: any, idx: any) =>
            typeof p === "number" ? (
              <Button
                key={idx}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm"
                onClick={() => onPageChange?.(p)}
                disabled={isLoading}
              >
                {p}
              </Button>
            ) : (
              <span
                key={idx}
                className="px-2 text-xs sm:text-sm flex items-center"
              >
                …
              </span>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm bg-transparent"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
          >
            →
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
