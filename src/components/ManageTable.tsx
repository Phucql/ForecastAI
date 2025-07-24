import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './utils/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './utils/table';


interface ForecastRow {
  PRD_LVL_MEMBER_NAME: string;
  TIM_LVL_MEMBER_VALUE: string;
  'Klug Forecast AI': number;
}

interface PivotedRow {
  item: string;
  [year: string]: string | number;
}

const ManageTables = ({ open, onClose, forecastData }: { open: boolean; onClose: () => void; forecastData: ForecastRow[] }) => {
  const [data, setData] = useState<PivotedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    if (!forecastData || forecastData.length === 0) return;

    const pivotMap: Record<string, PivotedRow> = {};
    const yearSet = new Set<string>();

    forecastData.forEach(row => {
      const name = row.PRD_LVL_MEMBER_NAME;
      const year = new Date(row.TIM_LVL_MEMBER_VALUE).getFullYear().toString();
      yearSet.add(year);
      if (!pivotMap[name]) {
        pivotMap[name] = { item: name };
      }
      pivotMap[name][year] = row['Klug Forecast AI'];
    });

    const sortedYears = Array.from(yearSet).sort();
    setColumns(['Item', ...sortedYears]);
    setData(Object.values(pivotMap));
  }, [forecastData]);

  const handleDownloadCSV = () => {
    if (!data || data.length === 0) {
      alert('No data to download.');
      return;
    }
    const header = columns;
    const rows = data.map(row => header.map(h => JSON.stringify(row[h] ?? "")).join(","));
    const csv = [header.join(","), ...rows].join("\n");
    if (!csv || csv.trim() === '') {
      alert('CSV is empty. Nothing to download.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border border-orange-200 bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-orange-900 tracking-tight drop-shadow-sm">Forecast AI Result Table</DialogTitle>
        </DialogHeader>
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleDownloadCSV}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full text-base shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            Download CSV
          </button>
        </div>
        <div className="overflow-auto">
          <Table className="min-w-max text-sm">
            <TableHeader className="sticky top-0 z-10 bg-orange-100/90 backdrop-blur">
              <TableRow className="bg-orange-100 text-orange-900 font-bold text-base">
                {columns.map(col => (
                  <TableHead key={col} className="bg-orange-100 text-orange-900 font-bold px-4 py-2 border-b border-orange-200">{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-orange-50/50'} hover:bg-orange-100/60`}>
                  {columns.map(col => (
                    <TableCell key={col} className="px-4 py-2 border-b border-orange-100">{row[col] ?? ''}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTables;
