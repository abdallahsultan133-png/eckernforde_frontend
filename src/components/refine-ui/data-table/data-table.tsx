"use client";

import type { BaseRecord, HttpError } from "@refinedev/core";
import type { UseTableReturnType } from "@refinedev/react-table";
import type { Column } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { AlertCircle, Inbox } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { DataTablePagination } from "@/components/refine-ui/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type DataTableProps<TData extends BaseRecord> = {
  table: UseTableReturnType<TData, HttpError>;
  emptyTitle?: string;
  emptyDescription?: string;
  ariaLabel?: string;
};

export function DataTable<TData extends BaseRecord>({
  table,
  emptyTitle = "No records found",
  emptyDescription = "There are no records matching the current view.",
  ariaLabel = "Records",
}: DataTableProps<TData>) {
  const {
    reactTable: { getHeaderGroups, getRowModel, getAllColumns },
    refineCore: {
      tableQuery,
      currentPage,
      setCurrentPage,
      pageCount,
      pageSize,
      setPageSize,
    },
  } = table;

  const columns = getAllColumns();
  const leafColumns = table.reactTable.getAllLeafColumns();
  const isLoading = tableQuery.isLoading;

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [isOverflowing, setIsOverflowing] = useState({
    horizontal: false,
    vertical: false,
  });

  useEffect(() => {
    const checkOverflow = () => {
      if (tableRef.current && tableContainerRef.current) {
        const table = tableRef.current;
        const container = tableContainerRef.current;

        const horizontalOverflow = table.offsetWidth > container.clientWidth;
        const verticalOverflow = table.offsetHeight > container.clientHeight;

        setIsOverflowing({
          horizontal: horizontalOverflow,
          vertical: verticalOverflow,
        });
      }
    };

    checkOverflow();

    // Check on window resize
    window.addEventListener("resize", checkOverflow);

    // Check when table data changes
    const timeoutId = setTimeout(checkOverflow, 100);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      clearTimeout(timeoutId);
    };
  }, [tableQuery.data?.data, pageSize]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div ref={tableContainerRef} className="overflow-hidden border-y border-border bg-card sm:rounded-lg sm:border">
        <Table ref={tableRef} aria-label={ariaLabel} aria-busy={isLoading} style={{ width: "100%" }}>
          <TableHeader className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm">
            {getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isPlaceholder = header.isPlaceholder;

                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        ...getCommonStyles({
                          column: header.column,
                          isOverflowing: isOverflowing,
                        }),
                      }}
                    >
                      {isPlaceholder ? null : (
                        <div className={cn("flex", "items-center", "gap-1")}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {tableQuery.isError ? (
              <DataTableStateRow
                columnsLength={columns.length}
                icon={AlertCircle}
                title="Unable to load records"
                description="Check your connection and permissions, then try again."
                tone="critical"
                action={<Button variant="outline" size="sm" onClick={() => tableQuery.refetch()}>Try again</Button>}
              />
            ) : isLoading ? (
                Array.from({ length: Math.min(Math.max(pageSize, 1), 8) }).map(
                  (_, rowIndex) => (
                    <TableRow
                      key={`skeleton-row-${rowIndex}`}
                      aria-hidden="true"
                    >
                      {leafColumns.map((column) => (
                        <TableCell
                          key={`skeleton-cell-${rowIndex}-${column.id}`}
                          style={{
                            ...getCommonStyles({
                              column,
                              isOverflowing: isOverflowing,
                            }),
                          }}
                          className="h-14"
                        >
                          <Skeleton className={cn("h-4", rowIndex % 3 === 0 ? "w-3/4" : "w-1/2")} />
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                )
            ) : getRowModel().rows?.length ? (
              getRowModel().rows.map((row) => {
                return (
                  <TableRow
                    key={row.original?.id ?? row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell
                          key={cell.id}
                          style={{
                            ...getCommonStyles({
                              column: cell.column,
                              isOverflowing: isOverflowing,
                            }),
                          }}
                        >
                          <div className="truncate">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <DataTableNoData
                columnsLength={columns.length}
                title={emptyTitle}
                description={emptyDescription}
              />
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && getRowModel().rows?.length > 0 && (
        <DataTablePagination
          currentPage={currentPage}
          pageCount={pageCount}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={tableQuery.data?.total}
        />
      )}
    </div>
  );
}

function DataTableNoData({
  columnsLength,
  title,
  description,
}: {
  columnsLength: number;
  title: string;
  description: string;
}) {
  return (
    <DataTableStateRow
      columnsLength={columnsLength}
      icon={Inbox}
      title={title}
      description={description}
    />
  );
}

function DataTableStateRow({
  columnsLength,
  icon: Icon,
  title,
  description,
  tone = "neutral",
  action,
}: {
  columnsLength: number;
  icon: typeof Inbox;
  title: string;
  description: string;
  tone?: "neutral" | "critical";
  action?: ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columnsLength} className="h-56 whitespace-normal px-6 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <Icon className={cn("h-5 w-5", tone === "critical" ? "text-destructive" : "text-muted-foreground")} aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function getCommonStyles<TData>({
  column,
  isOverflowing,
}: {
  column: Column<TData>;
  isOverflowing: {
    horizontal: boolean;
    vertical: boolean;
  };
}): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn =
    isPinned === "right" && column.getIsFirstColumn("right");

  return {
    boxShadow:
      isOverflowing.horizontal && isLastLeftPinnedColumn
        ? "-4px 0 4px -4px var(--border) inset"
        : isOverflowing.horizontal && isFirstRightPinnedColumn
        ? "4px 0 4px -4px var(--border) inset"
        : undefined,
    left:
      isOverflowing.horizontal && isPinned === "left"
        ? `${column.getStart("left")}px`
        : undefined,
    right:
      isOverflowing.horizontal && isPinned === "right"
        ? `${column.getAfter("right")}px`
        : undefined,
    opacity: 1,
    position: isOverflowing.horizontal && isPinned ? "sticky" : "relative",
    background: isOverflowing.horizontal && isPinned ? "var(--background)" : "",
    borderTopRightRadius:
      isOverflowing.horizontal && isPinned === "right"
        ? "var(--radius)"
        : undefined,
    borderBottomRightRadius:
      isOverflowing.horizontal && isPinned === "right"
        ? "var(--radius)"
        : undefined,
    borderTopLeftRadius:
      isOverflowing.horizontal && isPinned === "left"
        ? "var(--radius)"
        : undefined,
    borderBottomLeftRadius:
      isOverflowing.horizontal && isPinned === "left"
        ? "var(--radius)"
        : undefined,
    width: column.getSize(),
    zIndex: isOverflowing.horizontal && isPinned ? 1 : 0,
  };
}

DataTable.displayName = "DataTable";
