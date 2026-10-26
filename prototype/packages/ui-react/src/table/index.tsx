import {
  tableBodyClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadClass,
  tableHeaderClass,
  tableRowClass,
} from '@reinforce/ui-primitives/table';
import { cn } from '@reinforce/ui-styles/cn';
import type * as React from 'react';

type TableDensity = 'compact' | 'default' | 'comfortable';

function Table({
  className,
  density = 'default',
  ...props
}: React.ComponentProps<'table'> & { density?: TableDensity }) {
  return (
    <div data-slot="table-container" data-density={density} className={tableContainerClass}>
      <table data-slot="table" className={cn(tableClass, className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn(tableHeaderClass, className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn(tableBodyClass, className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr data-slot="table-row" className={cn(tableRowClass, className)} {...props} />;
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return <th data-slot="table-head" className={cn(tableHeadClass, className)} {...props} />;
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td data-slot="table-cell" className={cn(tableCellClass, className)} {...props} />;
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
