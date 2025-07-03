import * as React from "react";

// Table is now mobile responsive with horizontal scroll and nowrap cells. All tables in the app use this component.

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className = "", ...props }, ref) => (
    <table
      ref={ref}
      className={`w-full text-sm border-collapse min-w-[600px] md:min-w-0 ${className}`}
      {...props}
    />
  )
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...props }, ref) => (
    <thead
      ref={ref}
      className={`bg-gray-100 border-b ${className}`}
      {...props}
    />
  )
);
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", ...props }, ref) => (
    <tbody
      ref={ref}
      className={`divide-y ${className}`}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className = "", ...props }, ref) => (
    <tr
      ref={ref}
      className={`hover:bg-gray-50 ${className}`}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", ...props }, ref) => (
    <th
      ref={ref}
      className={`px-2 md:px-4 py-2 text-left font-medium text-gray-600 whitespace-nowrap ${className}`}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = "", ...props }, ref) => (
    <td
      ref={ref}
      className={`px-2 md:px-4 py-2 text-sm text-gray-700 whitespace-nowrap ${className}`}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";
