import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "frontend/src/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "frontend/src/components/ui/table";
import { Input } from "frontend/src/components/ui/input";
import { Button } from "frontend/src/components/ui/button";
import { Trace, TracesSettingsProps } from "frontend/src/types";
import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "frontend/src/components/ui/select";
import { Theme, useTheme } from "frontend/src/hooks";

const TraceabilityTab = ({ traces }: TracesSettingsProps) => {
  const { t } = useTranslation();
  const { applyTheme } = useTheme();
  const [isPrinting, setIsPrinting] = useState(false);
  const columns: ColumnDef<Trace>[] = [
    {
      accessorKey: "actionTimestamp",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {t("dashboard.settings.trace.date")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {t("dashboard.settings.trace.user")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      // truncate or wrap text in the cell
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return (
          <div className="max-w-xs overflow-hidden text-ellipsis break-all">
            {email}
          </div>
        );
      }
    },
    {
      accessorKey: "action",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {t("dashboard.settings.trace.action")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return (
          <div className="max-w-xs overflow-hidden text-ellipsis break-all">
            {action}
          </div>
        );
      }
    },
    {
      accessorKey: "sqlStatement",
      header: "SQL",
      cell: ({ row }) => {
        const sqlStatement = row.getValue("sqlStatement") as string;
        return (
          <div className="max-w-xs overflow-hidden break-all">
            {sqlStatement}
          </div>
        );
      },
    },
  ];

  interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
  }

  function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    
    // Use different row models based on printing state
    const rowModelOptions = isPrinting
      ? {
          getCoreRowModel: getCoreRowModel(),
          getSortedRowModel: getSortedRowModel(),
        }
      : {
          getCoreRowModel: getCoreRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
        };
    
    const table = useReactTable({
      data,
      columns,
      ...rowModelOptions,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      state: {
        sorting,
        columnFilters: isPrinting ? [] : columnFilters,
      },
    });

    return (
      <div className="w-full overflow-x-auto md:min-w-[600px] print:w-full">
        <div className="flex items-center justify-between py-2 md:py-4 print:hidden">
          <Input
            placeholder="Filter queries..."
            value={(table.getColumn("sqlStatement")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("sqlStatement")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <Button
            onClick={() => {
              // Set printing mode to true to show all rows
              setIsPrinting(true);
              
              // Save current theme
              const currentTheme = localStorage.getItem("theme") || "system";
              const currentDark = localStorage.getItem("darkMode") === "true";

              // Switch to light theme for printing
              applyTheme("neploy", false);

              // Trigger print
              setTimeout(() => {
                window.print();

                // Restore original theme and pagination after printing
                setTimeout(() => {
                  setIsPrinting(false);
                  applyTheme(currentTheme as Theme, currentDark);
                }, 500);
              }, 300);
            }}
            className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </Button>
        </div>
        <div className="rounded-md border min-w-[600px] print:border-0 print:rounded-none print:w-full">
          <Table className="print:border-collapse print:w-full">
            <TableHeader className="print:border-b print:border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="print:border-0">
                  {headerGroup.headers.map((header) => {
                    return <TableHead key={header.id} className="print:p-1 print:font-bold print:text-black print:bg-white">
                      {isPrinting ? 
                        (typeof header.column.columnDef.header === 'string' ? 
                          header.column.columnDef.header : 
                          header.column.id === 'actionTimestamp' ? t("dashboard.settings.trace.date") :
                          header.column.id === 'email' ? t("dashboard.settings.trace.user") :
                          header.column.id === 'action' ? t("dashboard.settings.trace.action") : 'SQL'
                        ) : 
                        (header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext()))
                      }
                    </TableHead>;
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="print:border-b print:border-gray-100">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="print:p-1 print:text-black">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end p-1 md:p-2 lg:p-4 print:hidden">
          <div className="flex items-center space-x-2 md:space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium hidden sm:block">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
              </Button>
              <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
              </Button>
              <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
              </Button>
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <Card className="print:shadow-none print:border-none print:bg-white print:w-full print:m-0">
        <CardHeader className="pb-0 print:hidden">
          <CardTitle className="flex justify-between items-center text-lg">{t("dashboard.settings.trace.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 max-w-full overflow-x-auto print:p-0 print:m-0">
          <DataTable columns={columns} data={traces} />
        </CardContent>
      </Card>
  );
};

export default TraceabilityTab;
