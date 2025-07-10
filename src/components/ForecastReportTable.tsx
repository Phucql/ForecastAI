import React, { useState } from 'react';

interface ForecastRow {
  item: string;
  measure: string;
  [key: string]: any;
}

interface ForecastReportTableProps {
  data: ForecastRow[];
}

const VISIBLE_YEAR = 2025;

const ForecastReportTable: React.FC<ForecastReportTableProps> = ({ data }) => {
  const [lockedRows, setLockedRows] = useState<Record<string, boolean>>({});
  const [approvedForecasts, setApprovedForecasts] = useState<Record<string, number>>({});

  const handleApprovedForecastChange = (item: string, value: number) => {
    setApprovedForecasts(prev => ({ ...prev, [item]: value }));
  };

  const toggleLock = (item: string) => {
    setLockedRows(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="text-orange-500">Item</th>
            <th>Measure</th>
            <th>Bookings History 2Y Ago ({VISIBLE_YEAR - 2})</th>
            <th>Bookings History 1Y Ago ({VISIBLE_YEAR - 1})</th>
            <th>Bookings Forecast</th>
            <th>Adjusted Forecast</th>
            <th>Approved Forecast</th>
            <th>Percent Change</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.item}>
              <td className="text-orange-500 font-semibold">{row.item}</td>
              <td>{row.measure}</td>
              <td>{row[VISIBLE_YEAR]?.history2YearsAgo ?? '-'}</td>
              <td>{row[VISIBLE_YEAR]?.history1YearAgo ?? '-'}</td>
              <td>{row[VISIBLE_YEAR]?.bookingsForecast ?? '-'}</td>
              <td>{row[VISIBLE_YEAR]?.adjustedBookingsForecast ?? '-'}</td>
              <td>
                <input
                  type="number"
                  className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                  value={
                    approvedForecasts[row.item] !== undefined
                      ? approvedForecasts[row.item]
                      : row[VISIBLE_YEAR]?.approvedForecast !== undefined
                        ? row[VISIBLE_YEAR]?.approvedForecast
                        : row[VISIBLE_YEAR]?.bookingsForecast || ''
                  }
                  onChange={e => handleApprovedForecastChange(row.item, parseFloat(e.target.value))}
                />
              </td>
              <td>
                {row[VISIBLE_YEAR]?.bookingsPercentChange !== undefined
                  ? `${row[VISIBLE_YEAR]?.bookingsPercentChange > 0 ? '+' : ''}${row[VISIBLE_YEAR]?.bookingsPercentChange.toFixed(2)}%`
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ForecastReportTable;
