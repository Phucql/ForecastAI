import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './utils/table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Card } from './utils/card';
import { LineChart } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface ForecastRow {
  item: string;
  history2023: number;
  history2024: number;
  forecast2025: number;
  adjustedForecast2025: number;
  approvedForecast2025: number;
  percentChange2025: number;
  history2024_2026: number;
  history2025_2026: number;
  forecast2026: number;
  adjustedForecast2026: number;
  approvedForecast2026: number;
  percentChange2026: number;
}

interface MonthlyRow {
  date: string;
  history2Y: number;
  history1Y: number;
  forecast: number;
  adjustedForecast: number;
  approvedForecast: number;
  percentChange: number;
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const months = [
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'
];

const monthMetrics = [
  { key: 'history2Y', label: 'Bookings History 2Y Ago' },
  { key: 'history1Y', label: 'Bookings History 1Y Ago' },
  { key: 'forecast', label: 'Bookings Forecast' },
  { key: 'adjustedForecast', label: 'Adjusted Forecast' },
  { key: 'approvedForecast', label: 'Approved Forecast' },
  { key: 'percentChange', label: 'Percent Change' },
];

// Add this helper at the top (after MonthlyRow interface):
function isMonthlyRow(obj: any): obj is MonthlyRow {
  return obj && typeof obj === 'object' && 'history2Y' in obj;
}

// Add this helper at the top (after MonthlyRow interface):
function formatPercent(val: number | undefined): string | null {
  if (typeof val === 'number' && !isNaN(val)) {
    if (val > 0) return `+${val.toFixed(2)}%`;
    if (val < 0) return `${val.toFixed(2)}%`;
  }
  return null;
}

const ManageTablesReportPage = ({ onBack }: { onBack: () => void }) => {
  const [data, setData] = useState<ForecastRow[]>([]);
  const [lockedRows, setLockedRows] = useState<Record<string, boolean>>({});
  const [expandedYears, setExpandedYears] = useState<Record<string, { year2025: boolean; year2026: boolean }>>({});
  const [monthlyData, setMonthlyData] = useState<Record<string, Record<string, [MonthlyRow?, MonthlyRow?]>>>({});
  const [totalBookingData, setTotalBookingData] = useState<any[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [approvedForecastEdits, setApprovedForecastEdits] = useState<Record<string, number>>({});
  const [businessLevelData, setBusinessLevelData] = useState<any[]>([]);
  const [businessMonthlyData, setBusinessMonthlyData] = useState<Record<string, Record<string, [MonthlyRow?, MonthlyRow?]>>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const tableRefs = [React.useRef<HTMLDivElement>(null), React.useRef<HTMLDivElement>(null)];
  const [customerClassCodes, setCustomerClassCodes] = useState<string[]>([]);
  const [selectedCustomerClassCode, setSelectedCustomerClassCode] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedGroupItems, setExpandedGroupItems] = useState<Record<string, boolean>>({});
  const [expandedSubfamilies, setExpandedSubfamilies] = useState<Record<string, boolean>>({});
  const [expandedColors, setExpandedColors] = useState<Record<string, boolean>>({});
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});
  const [expandedBusinessUnits, setExpandedBusinessUnits] = useState<Record<string, boolean>>({});
  const [expandedYear2025, setExpandedYear2025] = useState(false);
  const [expandedYear2026, setExpandedYear2026] = useState(false);
  // Add new state for business-level table
  const [businessExpandedYear2025, setBusinessExpandedYear2025] = useState(false);
  const [businessExpandedYear2026, setBusinessExpandedYear2026] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [forecastReportData, setForecastReportData] = useState([]); // or your actual data state

  // Fetch function for forecast report data
  const fetchForecastReportData = async () => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const res = await fetch(`${BASE_URL}/api/final-forecast-report`);
    const data = await res.json();
    setForecastReportData(data);
  };

  useEffect(() => {
    fetchForecastReportData();
  }, []);

  useEffect(() => {
    const fetchForecastTable = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/final-forecast-report`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch forecast report data:', err);
      }
    };
    fetchForecastTable();

    fetch(`${BASE_URL}/api/demand-classes`)
      .then(res => res.json())
      .then(setCustomerClassCodes)
      .catch(() => setCustomerClassCodes([]));
  }, []);

  // Fetch business-level data when filter changes
  useEffect(() => {
    const fetchBusinessLevelTable = async () => {
      try {
        const url = selectedCustomerClassCode
          ? `${BASE_URL}/api/business-level-forecast-report?customerClassCode=${encodeURIComponent(selectedCustomerClassCode)}`
          : `${BASE_URL}/api/business-level-forecast-report`;
        const res = await fetch(url);
        const json = await res.json();
        setBusinessLevelData(Array.isArray(json) ? json : []);
        setBusinessMonthlyData({}); // Clear monthly cache on filter change
      } catch (err) {
        setBusinessLevelData([]);
        console.error('Failed to fetch business-level forecast report data:', err);
      }
    };
    fetchBusinessLevelTable();
  }, [selectedCustomerClassCode]);

  const toggleLock = (item: string) => {
    setLockedRows((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleForecastChange = (
    item: string,
    date: string | null,
    field: 'approvedForecast2025' | 'approvedForecast2026' | 'approvedForecast',
    value: number
  ) => {
    if (date) {
      // Find the merged key for this item
      const mergedKey = `${item}_merged`;
      setMonthlyData((prev) => {
        const merged = { ...(prev[mergedKey] || {}) };
        // Find the month name from the date (e.g., "Jan 2025" -> "Jan")
        const monthName = date.split(' ')[0];
        const monthArr = merged[monthName] || [];
        // Update the correct year (0 for 2025, 1 for 2026)
        const year = date.endsWith('2025') ? 0 : 1;
        if (monthArr[year]) {
          (monthArr[year] as any)[field] = value;
        }
        merged[monthName] = monthArr;
        return { ...prev, [mergedKey]: merged };
      });
    } else {
      const newData = [...data];
      const index = newData.findIndex((r) => r.item === item);
      if (index !== -1) {
        (newData[index] as any)[field] = value;
        setData(newData);
      }
    }
  };

  const toggleYear = async (item: string, year: number) => {
    const key = `${item}_${year}`;
    setExpandedYears((prev) => {
      const current = prev[item] || { year2025: false, year2026: false };
      const updated = {
        ...prev,
        [item]: {
          ...current,
          [`year${year}`]: !current[`year${year}` as 'year2025' | 'year2026']
        }
      };
      return updated;
    });

    if (!monthlyData[`${item}_merged`]) {
      const [res25, res26] = await Promise.all([
        fetch(`${BASE_URL}/api/final-forecast-report/monthly?item=${item}&year=2025`),
        fetch(`${BASE_URL}/api/final-forecast-report/monthly?item=${item}&year=2026`)
      ]);

      const [monthly2025, monthly2026] = await Promise.all([
        res25.json(),
        res26.json()
      ]);

      const merged: Record<string, [MonthlyRow?, MonthlyRow?]> = {};

      for (let i = 0; i < 12; i++) {
        const monthName = monthNames[i];
        const m25 = monthly2025[i] ?? null;
        const m26 = monthly2026[i] ?? null;
        if (m25) m25.date = `${monthName} 2025`;
        if (m26) m26.date = `${monthName} 2026`;
        merged[monthName] = [m25, m26];
      }

      setMonthlyData((prev) => ({
        ...prev,
        [`${item}_merged`]: merged,
      }));
    }
  };

  const toggleBusinessUnit = (businessUnit: string) => {
    setExpandedBusinessUnits(prev => ({ ...prev, [businessUnit]: !prev[businessUnit] }));
  };

  const toggleBusinessYear = async (item: string, year: number) => {
    const key = `${item}_${year}`;
    setExpandedYears((prev) => {
      const current = prev[item] || { year2025: false, year2026: false };
      const updated = {
        ...prev,
        [item]: {
          ...current,
          [`year${year}`]: !current[`year${year}` as 'year2025' | 'year2026']
        }
      };
      return updated;
    });

    if (!businessMonthlyData[`${item}_merged`]) {
      const [res25, res26] = await Promise.all([
        fetch(`${BASE_URL}/api/business-level-forecast-report/monthly?item=${encodeURIComponent(item)}&year=2025${selectedCustomerClassCode ? `&customerClassCode=${encodeURIComponent(selectedCustomerClassCode)}` : ''}`),
        fetch(`${BASE_URL}/api/business-level-forecast-report/monthly?item=${encodeURIComponent(item)}&year=2026${selectedCustomerClassCode ? `&customerClassCode=${encodeURIComponent(selectedCustomerClassCode)}` : ''}`)
      ]);
      const [monthly2025, monthly2026] = await Promise.all([
        res25.json(),
        res26.json()
      ]);
      const merged: Record<string, [MonthlyRow?, MonthlyRow?]> = {};
      for (let i = 0; i < 12; i++) {
        const monthName = monthNames[i];
        const m25 = monthly2025[i] ?? null;
        const m26 = monthly2026[i] ?? null;
        if (m25) m25.date = `${monthName} 2025`;
        if (m26) m26.date = `${monthName} 2026`;
        merged[monthName] = [m25, m26];
      }
      setBusinessMonthlyData((prev) => ({ ...prev, [`${item}_merged`]: merged }));
    }
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sum = (arr: any[], field: string) => arr.reduce((acc, x) => acc + (x[field] || 0), 0);

  const handleApprovedForecastEdit = (key: string, value: number) => {
    setApprovedForecastEdits(prev => ({ ...prev, [key]: value }));
  };

  const toggleGroup = (color: string) => {
    setExpandedGroups(prev => ({ ...prev, [color]: !prev[color] }));
  };

  const toggleGroupItem = (item: string) => {
    setExpandedGroupItems(prev => ({ ...prev, [item]: !prev[item] }));
    // Fetch monthly data if not already loaded
    if (!businessMonthlyData[`${item}_merged`]) {
      Promise.all([
        fetch(`${BASE_URL}/api/business-level-forecast-report/monthly?item=${encodeURIComponent(item)}&year=2025${selectedCustomerClassCode ? `&customerClassCode=${encodeURIComponent(selectedCustomerClassCode)}` : ''}`),
        fetch(`${BASE_URL}/api/business-level-forecast-report/monthly?item=${encodeURIComponent(item)}&year=2026${selectedCustomerClassCode ? `&customerClassCode=${encodeURIComponent(selectedCustomerClassCode)}` : ''}`)
      ]).then(async ([res25, res26]) => {
        const [monthly2025, monthly2026] = await Promise.all([
          res25.json(),
          res26.json()
        ]);
        const merged: Record<string, [MonthlyRow?, MonthlyRow?]> = {};
        for (let i = 0; i < 12; i++) {
          const monthName = monthNames[i];
          const m25 = monthly2025[i] ?? null;
          const m26 = monthly2026[i] ?? null;
          if (m25) m25.date = `${monthName} 2025`;
          if (m26) m26.date = `${monthName} 2026`;
          merged[monthName] = [m25, m26];
        }
        setBusinessMonthlyData(prev => ({ ...prev, [`${item}_merged`]: merged }));
      });
    }
  };

  const toggleSubfamily = (subfamily: string) => {
    setExpandedSubfamilies(prev => ({ ...prev, [subfamily]: !prev[subfamily] }));
  };
  const toggleColor = (colorKey: string) => {
    setExpandedColors(prev => ({ ...prev, [colorKey]: !prev[colorKey] }));
  };

  const toggleFamily = (family: string) => {
    setExpandedFamilies(prev => ({ ...prev, [family]: !prev[family] }));
  };

  // Drag handlers
  const handleMouseDown = (idx: number, e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - (tableRefs[idx].current?.scrollLeft || 0));
    setScrollLeft(tableRefs[idx].current?.scrollLeft || 0);
  };
  const handleMouseMove = (idx: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (!tableRefs[idx].current) return;
    const x = e.pageX - tableRefs[idx].current.getBoundingClientRect().left;
    tableRefs[idx].current.scrollLeft = scrollLeft - (x - startX);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const renderBusinessLevelTable = () => {
    console.log('businessLevelData', businessLevelData);
    if (!Array.isArray(businessLevelData) || businessLevelData.length === 0) {
  return (
        <TableRow>
          <TableCell colSpan={100} className="text-center text-orange-700 py-8">
            No business-level data available.
          </TableCell>
        </TableRow>
      );
    }
    return businessLevelData
      .filter((bu: any) => bu.business_unit && bu.business_unit.trim() !== '')
      .map((bu: any, i: number) => (
        <React.Fragment key={bu.business_unit}>
          {/* Business Unit row */}
          <TableRow className={`transition-colors bg-orange-100/90 hover:bg-orange-200/60`}>
            <TableCell className="font-semibold whitespace-nowrap text-orange-900 pl-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBusinessUnit(bu.business_unit)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150
                    ${expandedBusinessUnits[bu.business_unit] ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-700'}
                    focus:outline-none focus:ring-2 focus:ring-orange-300`}
                  aria-label={expandedBusinessUnits[bu.business_unit] ? 'Collapse business unit' : 'Expand business unit'}
                  title={expandedBusinessUnits[bu.business_unit] ? 'Collapse business unit' : 'Expand business unit'}
                >
                  <ChevronRight
                    className={`w-5 h-5 transition-transform duration-200 ${expandedBusinessUnits[bu.business_unit] ? 'rotate-90' : ''}`}
                  />
                </button>
                <span className="font-extrabold text-sm">{bu.business_unit}</span>
              </div>
            </TableCell>
            {/* Business Unit summary columns */}
            <TableCell></TableCell>
            <TableCell className="bg-white">{typeof bu.history2023 === 'number' ? bu.history2023.toFixed(2) : bu.history2023}</TableCell>
            <TableCell className="bg-white">{typeof bu.history2024 === 'number' ? bu.history2024.toFixed(2) : bu.history2024}</TableCell>
            <TableCell className="bg-white">{typeof bu.forecast2025 === 'number' ? bu.forecast2025.toFixed(2) : bu.forecast2025}</TableCell>
            <TableCell className="bg-white">{typeof bu.adjustedForecast2025 === 'number' ? bu.adjustedForecast2025.toFixed(2) : bu.adjustedForecast2025}</TableCell>
            <TableCell className="bg-white">
              <input
                type="number"
                className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                value={typeof bu.approvedForecast2025 === 'number' ? bu.approvedForecast2025.toFixed(2) : bu.approvedForecast2025}
                onChange={(e) => handleForecastChange(bu.business_unit, null, 'approvedForecast2025', parseFloat(e.target.value))}
                disabled={lockedRows[bu.business_unit]}
                aria-label="Approved Forecast 2025"
              />
              {lockedRows[bu.business_unit] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
              <button
                onClick={() => toggleLock(bu.business_unit)}
                className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                aria-label={lockedRows[bu.business_unit] ? 'Unlock row' : 'Lock row'}
                title={lockedRows[bu.business_unit] ? 'Unlock row' : 'Lock row'}
              >
                {lockedRows[bu.business_unit] ? '🔒' : '🔓'}
              </button>
            </TableCell>
            <TableCell className={`text-center font-semibold`}>
              {formatPercent(bu.percentChange2025) && (
                <span className={
                  bu.percentChange2025 > 0
                    ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                    : bu.percentChange2025 < 0
                      ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                      : ''
                }>
                  {formatPercent(bu.percentChange2025)}
                </span>
              )}
            </TableCell>
            <TableCell></TableCell>
            <TableCell className="bg-white">{typeof bu.history2024_2026 === 'number' ? bu.history2024_2026.toFixed(2) : bu.history2024_2026}</TableCell>
            <TableCell className="bg-white">{typeof bu.history2025_2026 === 'number' ? bu.history2025_2026.toFixed(2) : bu.history2025_2026}</TableCell>
            <TableCell className="bg-white">{typeof bu.forecast2026 === 'number' ? bu.forecast2026.toFixed(2) : bu.forecast2026}</TableCell>
            <TableCell className="bg-white">{typeof bu.adjustedForecast2026 === 'number' ? bu.adjustedForecast2026.toFixed(2) : bu.adjustedForecast2026}</TableCell>
            <TableCell className="bg-white">
              <input
                type="number"
                className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                value={typeof bu.approvedForecast2026 === 'number' ? bu.approvedForecast2026.toFixed(2) : bu.approvedForecast2026}
                onChange={(e) => handleForecastChange(bu.business_unit, null, 'approvedForecast2026', parseFloat(e.target.value))}
                disabled={lockedRows[bu.business_unit]}
                aria-label="Approved Forecast 2026"
              />
              {lockedRows[bu.business_unit] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
              <button
                onClick={() => toggleLock(bu.business_unit)}
                className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                aria-label={lockedRows[bu.business_unit] ? 'Unlock row' : 'Lock row'}
                title={lockedRows[bu.business_unit] ? 'Unlock row' : 'Lock row'}
              >
                {lockedRows[bu.business_unit] ? '🔒' : '🔓'}
                </button>
            </TableCell>
            <TableCell className={`text-center font-semibold`}>
              {formatPercent(bu.percentChange2026) && (
                <span className={
                  bu.percentChange2026 > 0
                    ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                    : bu.percentChange2026 < 0
                      ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                      : ''
                }>
                  {formatPercent(bu.percentChange2026)}
                </span>
              )}
            </TableCell>
            </TableRow>
          {/* Family rows */}
          {expandedBusinessUnits[bu.business_unit] && bu.children
            .filter((fam: any) => fam.family && fam.family.trim() !== '')
            .map((fam: any, j: number) => (
              <React.Fragment key={fam.family}>
                <TableRow className={`transition-colors bg-orange-50/90 hover:bg-orange-100/60`}>
                  <TableCell className="font-semibold whitespace-nowrap text-orange-900 pl-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFamily(fam.family)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150
                          ${expandedFamilies[fam.family] ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-700'}
                          focus:outline-none focus:ring-2 focus:ring-orange-300`}
                        aria-label={expandedFamilies[fam.family] ? 'Collapse family' : 'Expand family'}
                        title={expandedFamilies[fam.family] ? 'Collapse family' : 'Expand family'}
                      >
                        <ChevronRight
                          className={`w-5 h-5 transition-transform duration-200 ${expandedFamilies[fam.family] ? 'rotate-90' : ''}`}
                        />
                      </button>
                      <span className="font-bold">{fam.family}</span>
                    </div>
                  </TableCell>
                  {/* Family summary columns */}
                  <TableCell></TableCell>
                  <TableCell className="bg-white">{typeof fam.history2023 === 'number' ? fam.history2023.toFixed(2) : fam.history2023}</TableCell>
                  <TableCell className="bg-white">{typeof fam.history2024 === 'number' ? fam.history2024.toFixed(2) : fam.history2024}</TableCell>
                  <TableCell className="bg-white">{typeof fam.forecast2025 === 'number' ? fam.forecast2025.toFixed(2) : fam.forecast2025}</TableCell>
                  <TableCell className="bg-white">{typeof fam.adjustedForecast2025 === 'number' ? fam.adjustedForecast2025.toFixed(2) : fam.adjustedForecast2025}</TableCell>
                  <TableCell className="bg-white">
                    <input
                      type="number"
                      className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                      value={typeof fam.approvedForecast2025 === 'number' ? fam.approvedForecast2025.toFixed(2) : fam.approvedForecast2025}
                      onChange={(e) => handleForecastChange(fam.family, null, 'approvedForecast2025', parseFloat(e.target.value))}
                      disabled={lockedRows[fam.family]}
                      aria-label="Approved Forecast 2025"
                    />
                    {lockedRows[fam.family] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
                    <button
                      onClick={() => toggleLock(fam.family)}
                      className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                      aria-label={lockedRows[fam.family] ? 'Unlock row' : 'Lock row'}
                      title={lockedRows[fam.family] ? 'Unlock row' : 'Lock row'}
                    >
                      {lockedRows[fam.family] ? '🔒' : '🔓'}
                    </button>
                  </TableCell>
                  <TableCell className={`text-center font-semibold`}>
                    {formatPercent(fam.percentChange2025) && (
                      <span className={
                        fam.percentChange2025 > 0
                          ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                          : fam.percentChange2025 < 0
                            ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                            : ''
                      }>
                        {formatPercent(fam.percentChange2025)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="bg-white">{typeof fam.history2024_2026 === 'number' ? fam.history2024_2026.toFixed(2) : fam.history2024_2026}</TableCell>
                  <TableCell className="bg-white">{typeof fam.history2025_2026 === 'number' ? fam.history2025_2026.toFixed(2) : fam.history2025_2026}</TableCell>
                  <TableCell className="bg-white">{typeof fam.forecast2026 === 'number' ? fam.forecast2026.toFixed(2) : fam.forecast2026}</TableCell>
                  <TableCell className="bg-white">{typeof fam.adjustedForecast2026 === 'number' ? fam.adjustedForecast2026.toFixed(2) : fam.adjustedForecast2026}</TableCell>
                  <TableCell className="bg-white">
                    <input
                      type="number"
                      className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                      value={typeof fam.approvedForecast2026 === 'number' ? fam.approvedForecast2026.toFixed(2) : fam.approvedForecast2026}
                      onChange={(e) => handleForecastChange(fam.family, null, 'approvedForecast2026', parseFloat(e.target.value))}
                      disabled={lockedRows[fam.family]}
                      aria-label="Approved Forecast 2026"
                    />
                    {lockedRows[fam.family] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
                    <button
                      onClick={() => toggleLock(fam.family)}
                      className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                      aria-label={lockedRows[fam.family] ? 'Unlock row' : 'Lock row'}
                      title={lockedRows[fam.family] ? 'Unlock row' : 'Lock row'}
                    >
                      {lockedRows[fam.family] ? '🔒' : '🔓'}
                    </button>
                  </TableCell>
                  <TableCell className={`text-center font-semibold`}>
                    {formatPercent(fam.percentChange2026) && (
                      <span className={
                        fam.percentChange2026 > 0
                          ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                          : fam.percentChange2026 < 0
                            ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                            : ''
                      }>
                        {formatPercent(fam.percentChange2026)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
                {/* Subfamily rows */}
                {expandedFamilies[fam.family] && fam.children
                  .filter((sub: any) => sub.subfamily && sub.subfamily.trim() !== '')
                  .map((sub: any, k: number) => (
                    <React.Fragment key={sub.subfamily}>
                      <TableRow className={`transition-colors bg-orange-50/80 hover:bg-orange-100/60`}>
                        <TableCell className="font-semibold whitespace-nowrap text-orange-900 pl-12">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSubfamily(sub.subfamily)}
                              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150
                                ${expandedSubfamilies[sub.subfamily] ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-700'}
                                focus:outline-none focus:ring-2 focus:ring-orange-300`}
                              aria-label={expandedSubfamilies[sub.subfamily] ? 'Collapse subfamily' : 'Expand subfamily'}
                              title={expandedSubfamilies[sub.subfamily] ? 'Collapse subfamily' : 'Expand subfamily'}
                            >
                              <ChevronRight
                                className={`w-5 h-5 transition-transform duration-200 ${expandedSubfamilies[sub.subfamily] ? 'rotate-90' : ''}`}
                              />
                            </button>
                            <span className="font-bold">{sub.subfamily}</span>
                          </div>
                        </TableCell>
                        {/* Subfamily summary columns */}
                        <TableCell></TableCell>
                        <TableCell className="bg-white">{typeof sub.history2023 === 'number' ? sub.history2023.toFixed(2) : sub.history2023}</TableCell>
                        <TableCell className="bg-white">{typeof sub.history2024 === 'number' ? sub.history2024.toFixed(2) : sub.history2024}</TableCell>
                        <TableCell className="bg-white">{typeof sub.forecast2025 === 'number' ? sub.forecast2025.toFixed(2) : sub.forecast2025}</TableCell>
                        <TableCell className="bg-white">{typeof sub.adjustedForecast2025 === 'number' ? sub.adjustedForecast2025.toFixed(2) : sub.adjustedForecast2025}</TableCell>
                        <TableCell className="bg-white">
                          <input
                            type="number"
                            className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                            value={typeof sub.approvedForecast2025 === 'number' ? sub.approvedForecast2025.toFixed(2) : sub.approvedForecast2025}
                            onChange={(e) => handleForecastChange(sub.subfamily, null, 'approvedForecast2025', parseFloat(e.target.value))}
                            disabled={lockedRows[sub.subfamily]}
                            aria-label="Approved Forecast 2025"
                          />
                          {lockedRows[sub.subfamily] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
                          <button
                            onClick={() => toggleLock(sub.subfamily)}
                            className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                            aria-label={lockedRows[sub.subfamily] ? 'Unlock row' : 'Lock row'}
                            title={lockedRows[sub.subfamily] ? 'Unlock row' : 'Lock row'}
                          >
                            {lockedRows[sub.subfamily] ? '🔒' : '🔓'}
                          </button>
                        </TableCell>
                        <TableCell className={`text-center font-semibold`}>
                          {formatPercent(sub.percentChange2025) && (
                            <span className={
                              sub.percentChange2025 > 0
                                ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                : sub.percentChange2025 < 0
                                  ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                  : ''
                            }>
                              {formatPercent(sub.percentChange2025)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="bg-white">{typeof sub.history2024_2026 === 'number' ? sub.history2024_2026.toFixed(2) : sub.history2024_2026}</TableCell>
                        <TableCell className="bg-white">{typeof sub.history2025_2026 === 'number' ? sub.history2025_2026.toFixed(2) : sub.history2025_2026}</TableCell>
                        <TableCell className="bg-white">{typeof sub.forecast2026 === 'number' ? sub.forecast2026.toFixed(2) : sub.forecast2026}</TableCell>
                        <TableCell className="bg-white">{typeof sub.adjustedForecast2026 === 'number' ? sub.adjustedForecast2026.toFixed(2) : sub.adjustedForecast2026}</TableCell>
                        <TableCell className="bg-white">
                        <input
                          type="number"
                            className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                            value={typeof sub.approvedForecast2026 === 'number' ? sub.approvedForecast2026.toFixed(2) : sub.approvedForecast2026}
                            onChange={(e) => handleForecastChange(sub.subfamily, null, 'approvedForecast2026', parseFloat(e.target.value))}
                            disabled={lockedRows[sub.subfamily]}
                            aria-label="Approved Forecast 2026"
                          />
                          {lockedRows[sub.subfamily] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
                          <button
                            onClick={() => toggleLock(sub.subfamily)}
                            className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                            aria-label={lockedRows[sub.subfamily] ? 'Unlock row' : 'Lock row'}
                            title={lockedRows[sub.subfamily] ? 'Unlock row' : 'Lock row'}
                          >
                            {lockedRows[sub.subfamily] ? '🔒' : '🔓'}
                          </button>
                        </TableCell>
                        <TableCell className={`text-center font-semibold`}>
                          {formatPercent(sub.percentChange2026) && (
                            <span className={
                              sub.percentChange2026 > 0
                                ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                : sub.percentChange2026 < 0
                                  ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                  : ''
                            }>
                              {formatPercent(sub.percentChange2026)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                      {/* Color rows */}
                      {expandedSubfamilies[sub.subfamily] && sub.children
                        .filter((color: any) => color.color && color.color.trim() !== '')
                        .map((color: any, m: number) => (
                          <React.Fragment key={color.color}>
                            <TableRow className={`transition-colors bg-orange-50/40 hover:bg-orange-100/40`}>
                              <TableCell className="font-semibold whitespace-nowrap text-orange-800 pl-24">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleColor(sub.subfamily + '||' + color.color)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150
                                      ${expandedColors[sub.subfamily + '||' + color.color] ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-700'}
                                      focus:outline-none focus:ring-2 focus:ring-orange-300`}
                                    aria-label={expandedColors[sub.subfamily + '||' + color.color] ? 'Collapse color' : 'Expand color'}
                                    title={expandedColors[sub.subfamily + '||' + color.color] ? 'Collapse color' : 'Expand color'}
                                  >
                                    <ChevronRight
                                      className={`w-5 h-5 transition-transform duration-200 ${expandedColors[sub.subfamily + '||' + color.color] ? 'rotate-90' : ''}`}
                                    />
                                  </button>
                                  <span className="font-bold">{color.color}</span>
                                </div>
                      </TableCell>
                              {/* Color summary columns */}
                              <TableCell></TableCell>
                              <TableCell className="bg-white">{typeof color.history2023 === 'number' ? color.history2023.toFixed(2) : color.history2023}</TableCell>
                              <TableCell className="bg-white">{typeof color.history2024 === 'number' ? color.history2024.toFixed(2) : color.history2024}</TableCell>
                              <TableCell className="bg-white">{typeof color.forecast2025 === 'number' ? color.forecast2025.toFixed(2) : color.forecast2025}</TableCell>
                              <TableCell className="bg-white">{typeof color.adjustedForecast2025 === 'number' ? color.adjustedForecast2025.toFixed(2) : color.adjustedForecast2025}</TableCell>
                              <TableCell className="bg-white">
                                <input
                                  type="number"
                                  className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                                  value={typeof color.approvedForecast2025 === 'number' ? color.approvedForecast2025.toFixed(2) : color.approvedForecast2025}
                                  onChange={(e) => handleForecastChange(color.color, null, 'approvedForecast2025', parseFloat(e.target.value))}
                                  disabled={lockedRows[color.color]}
                                  aria-label="Approved Forecast 2025"
                                />
                                {lockedRows[color.color] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
                                <button
                                  onClick={() => toggleLock(color.color)}
                                  className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                                  aria-label={lockedRows[color.color] ? 'Unlock row' : 'Lock row'}
                                  title={lockedRows[color.color] ? 'Unlock row' : 'Lock row'}
                                >
                                  {lockedRows[color.color] ? '🔒' : '🔓'}
                                </button>
                              </TableCell>
                              <TableCell className={`text-center font-semibold`}>
                                {(() => {
                                  const val = color.percentChange2025;
                                  const percentText = formatPercent(val);
                                  if (!percentText) return null;
                                  return (
                                    <span className={
                                      val > 0
                                        ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                        : val < 0
                                          ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                          : ''
                                    }>
                                      {percentText}
                                    </span>
                                  );
                                })()}
                      </TableCell>
                              <TableCell></TableCell>
                              <TableCell className="bg-white">{typeof color.history2024_2026 === 'number' ? color.history2024_2026.toFixed(2) : color.history2024_2026}</TableCell>
                              <TableCell className="bg-white">{typeof color.history2025_2026 === 'number' ? color.history2025_2026.toFixed(2) : color.history2025_2026}</TableCell>
                              <TableCell className="bg-white">{typeof color.forecast2026 === 'number' ? color.forecast2026.toFixed(2) : color.forecast2026}</TableCell>
                              <TableCell className="bg-white">{typeof color.adjustedForecast2026 === 'number' ? color.adjustedForecast2026.toFixed(2) : color.adjustedForecast2026}</TableCell>
                              <TableCell className="bg-white">
                        <input
                          type="number"
                                  className="border border-orange-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                                  value={typeof color.approvedForecast2026 === 'number' ? color.approvedForecast2026.toFixed(2) : color.approvedForecast2026}
                                  onChange={(e) => handleForecastChange(color.color, null, 'approvedForecast', parseFloat(e.target.value))}
                                  disabled={lockedRows[color.color]}
                                  aria-label="Approved Forecast 2026"
                                />
                                {lockedRows[color.color] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
                                <button
                                  onClick={() => toggleLock(color.color)}
                                  className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                                  aria-label={lockedRows[color.color] ? 'Unlock row' : 'Lock row'}
                                  title={lockedRows[color.color] ? 'Unlock row' : 'Lock row'}
                                >
                                  {lockedRows[color.color] ? '🔒' : '🔓'}
                                </button>
                              </TableCell>
                              <TableCell className={`text-center font-semibold`}>
                                {(() => {
                                  const val = color.percentChange2026;
                                  const percentText = formatPercent(val);
                                  if (!percentText) return null;
                                  return (
                                    <span className={
                                      val > 0
                                        ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                        : val < 0
                                          ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                          : ''
                                    }>
                                      {percentText}
                                    </span>
                                  );
                                })()}
                              </TableCell>
                            </TableRow>
                            {/* Item rows */}
                            {expandedColors[sub.subfamily + '||' + color.color] && color.children
                              .filter((item: any) => item.item && item.item.trim() !== '')
                              .map((item: any, n: number) => (
                                <React.Fragment key={item.item}>
                                  <TableRow className={`bg-gray-50/70 text-sm`}>
                                    <TableCell className="font-medium whitespace-nowrap text-gray-700 pl-32">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setExpandedGroupItems(prev => ({ ...prev, [item.item]: !prev[item.item] }));
                                            if (!businessMonthlyData[`${item.item}_merged`]) {
                                              Promise.all([
                                                fetch(`${BASE_URL}/api/business-level-forecast-report/monthly?item=${encodeURIComponent(item.item)}&year=2025${selectedCustomerClassCode ? `&customerClassCode=${encodeURIComponent(selectedCustomerClassCode)}` : ''}`),
                                                fetch(`${BASE_URL}/api/business-level-forecast-report/monthly?item=${encodeURIComponent(item.item)}&year=2026${selectedCustomerClassCode ? `&customerClassCode=${encodeURIComponent(selectedCustomerClassCode)}` : ''}`)
                                              ]).then(async ([res25, res26]) => {
                                                const [monthly2025, monthly2026] = await Promise.all([
                                                  res25.json(),
                                                  res26.json()
                                                ]);
                                                const merged: Record<string, [MonthlyRow?, MonthlyRow?]> = {};
                                                for (let i = 0; i < 12; i++) {
                                                  const monthName = monthNames[i];
                                                  const m25 = monthly2025[i] ?? null;
                                                  const m26 = monthly2026[i] ?? null;
                                                  if (m25) m25.date = `${monthName} 2025`;
                                                  if (m26) m26.date = `${monthName} 2026`;
                                                  merged[monthName] = [m25, m26];
                                                }
                                                setBusinessMonthlyData(prev => ({ ...prev, [`${item.item}_merged`]: merged }));
                                              });
                                            }
                                          }}
                                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150
                                            ${expandedGroupItems[item.item] ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-700'}
                                            focus:outline-none focus:ring-2 focus:ring-orange-300`}
                                          aria-label={expandedGroupItems[item.item] ? 'Collapse item' : 'Expand item'}
                                          title={expandedGroupItems[item.item] ? 'Collapse item' : 'Expand item'}
                                        >
                                          <ChevronRight
                                            className={`w-5 h-5 transition-transform duration-200 ${expandedGroupItems[item.item] ? 'rotate-90' : ''}`}
                                          />
                                        </button>
                                        <span>{item.item}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell></TableCell> {/* for alignment, matches summary rows */}
                                    <TableCell className="bg-white">{typeof item.history2023 === 'number' ? (item.history2023 as number).toFixed(2) : (item.history2023 ?? '')}</TableCell>
                                    <TableCell className="bg-white">{typeof item.history2024 === 'number' ? (item.history2024 as number).toFixed(2) : (item.history2024 ?? '')}</TableCell>
                                    <TableCell className="bg-white">{typeof item.forecast2025 === 'number' ? (item.forecast2025 as number).toFixed(2) : (item.forecast2025 ?? '')}</TableCell>
                                    <TableCell className="bg-white">{typeof item.adjustedForecast2025 === 'number' ? (item.adjustedForecast2025 as number).toFixed(2) : (item.adjustedForecast2025 ?? '')}</TableCell>
                                    <TableCell className="bg-white">
                                      <input
                                        type="number"
                                        className="border border-gray-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                                        value={typeof item.approvedForecast2025 === 'number' ? item.approvedForecast2025.toFixed(2) : item.approvedForecast2025}
                                        onChange={(e) => handleForecastChange(item.item, null, 'approvedForecast2025', parseFloat(e.target.value))}
                                        disabled={lockedRows[item.item]}
                                        aria-label="Approved Forecast 2025"
                                      />
                                      {lockedRows[item.item] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
                                      <button
                                        onClick={() => toggleLock(item.item)}
                                        className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                                        aria-label={lockedRows[item.item] ? 'Unlock row' : 'Lock row'}
                                        title={lockedRows[item.item] ? 'Unlock row' : 'Lock row'}
                                      >
                                        {lockedRows[item.item] ? '🔒' : '🔓'}
                                      </button>
                                    </TableCell>
                                    <TableCell className={`text-center font-semibold`}>
                                      {formatPercent(item.percentChange2025) && (
                                        <span className={
                                          item.percentChange2025 > 0
                                            ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                            : item.percentChange2025 < 0
                                              ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                              : ''
                                        }>
                                          {formatPercent(item.percentChange2025)}
                                        </span>
                                      )}
                      </TableCell>
                                    {/* Item summary columns for 2026 */}
                                    <TableCell className="bg-white">{typeof item.history2024_2026 === 'number' ? (item.history2024_2026 as number).toFixed(2) : (item.history2024_2026 ?? '')}</TableCell>
                                    <TableCell className="bg-white">{typeof item.history2025_2026 === 'number' ? (item.history2025_2026 as number).toFixed(2) : (item.history2025_2026 ?? '')}</TableCell>
                                    <TableCell className="bg-white">{typeof item.forecast2026 === 'number' ? (item.forecast2026 as number).toFixed(2) : (item.forecast2026 ?? '')}</TableCell>
                                    <TableCell className="bg-white">{typeof item.adjustedForecast2026 === 'number' ? (item.adjustedForecast2026 as number).toFixed(2) : (item.adjustedForecast2026 ?? '')}</TableCell>
                                    <TableCell className="bg-white">
                                      <input
                                        type="number"
                                        className="border border-gray-200 px-2 py-1 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                                        value={typeof item.approvedForecast2026 === 'number' ? item.approvedForecast2026.toFixed(2) : item.approvedForecast2026}
                                        onChange={(e) => handleForecastChange(item.item, null, 'approvedForecast2026', parseFloat(e.target.value))}
                                        disabled={lockedRows[item.item]}
                                        aria-label="Approved Forecast 2026"
                                      />
                                      {lockedRows[item.item] && <span className="ml-1 text-orange-600 text-xs" title="Planning Manager Approved">PM</span>}
                                      <button
                                        onClick={() => toggleLock(item.item)}
                                        className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                                        aria-label={lockedRows[item.item] ? 'Unlock row' : 'Lock row'}
                                        title={lockedRows[item.item] ? 'Unlock row' : 'Lock row'}
                                      >
                                        {lockedRows[item.item] ? '🔒' : '🔓'}
                                      </button>
                                    </TableCell>
                                    <TableCell className={`text-center font-semibold`}>
                                      {formatPercent(item.percentChange2026) && (
                                        <span className={
                                          item.percentChange2026 > 0
                                            ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                            : item.percentChange2026 < 0
                                              ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                              : ''
                                        }>
                                          {formatPercent(item.percentChange2026)}
                                        </span>
                                      )}
                      </TableCell>
                    </TableRow>
                                  {/* Expanded monthly breakdown row */}
                                  {expandedGroupItems[item.item] && (
                                    <TableRow className="bg-orange-50/80 text-xs">
                                      <TableCell></TableCell> {/* This aligns with the 'Measure' column in the header */}
                                      <TableCell></TableCell> {/* Extra cell for alignment, matches item-level row */}
                                      {/* Always show 2025 months */}
                                      {monthNames.map((month, mIdx) => {
                                        const m25 = businessMonthlyData[`${item.item}_merged`]?.[month]?.[0];
                                        return [
                                          <TableCell key={`2025_${month}_history2Y`} className="bg-white">{isMonthlyRow(m25) && typeof m25.history2Y === 'number' ? m25.history2Y.toFixed(2) : ''}</TableCell>,
                                          <TableCell key={`2025_${month}_history1Y`} className="bg-white">{isMonthlyRow(m25) && typeof m25.history1Y === 'number' ? m25.history1Y.toFixed(2) : ''}</TableCell>,
                                          <TableCell key={`2025_${month}_forecast`} className="bg-white">{isMonthlyRow(m25) && typeof m25.forecast === 'number' ? m25.forecast.toFixed(2) : ''}</TableCell>,
                                          <TableCell key={`2025_${month}_adjusted`} className="bg-white">{isMonthlyRow(m25) && typeof m25.forecast === 'number' ? (m25.forecast * 1.05).toFixed(2) : ''}</TableCell>,
                                          <TableCell key={`2025_${month}_approved`}>
                                            <div className="flex items-center">
                                              {isMonthlyRow(m25) && typeof m25.approvedForecast === 'number' ? (
                                                <input
                                                  type="number"
                                                  className="border border-orange-300 px-2 py-1 rounded-lg w-16 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                                                  value={typeof m25.approvedForecast === 'number' ? m25.approvedForecast.toFixed(2) : ''}
                                                  onChange={e => handleForecastChange(item.item, m25.date ?? '', 'approvedForecast', parseFloat(e.target.value))}
                                                  disabled={lockedRows[item.item]}
                                                />
                                              ) : ''}
                                              <button
                                                onClick={() => toggleLock(item.item)}
                                                className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                                                aria-label={lockedRows[item.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                                                title={lockedRows[item.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                                                type="button"
                                              >
                                                {lockedRows[item.item] ? '🔒' : '🔓'}
                                              </button>
                                            </div>
                                          </TableCell>,
                                          <TableCell key={`2025_${month}_percent`} className="bg-white border-r-2 border-orange-300">
                                            {(() => {
                                              const val = m25?.percentChange;
                                              const percentText = formatPercent(val);
                                              if (!percentText) return null;
                                              return (
                                                <span className={
                                                  percentText.startsWith('+')
                                                    ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                                    : percentText.startsWith('-')
                                                      ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                                      : ''
                                                }>
                                                  {percentText}
                                                </span>
                                              );
                                            })()}
                                          </TableCell>
                                        ];
                                      })}
                                      {/* Always show 2026 months */}
                                      {monthNames.map((month, mIdx) => {
                                        const m26 = businessMonthlyData[`${item.item}_merged`]?.[month]?.[1];
                                        return [
                                          <TableCell key={`2026_${month}_history2Y`} className="bg-white">{isMonthlyRow(m26) && typeof m26.history2Y === 'number' ? m26.history2Y.toFixed(2) : ''}</TableCell>,
                                          <TableCell key={`2026_${month}_history1Y`} className="bg-white">{isMonthlyRow(m26) && typeof m26.history1Y === 'number' ? m26.history1Y.toFixed(2) : ''}</TableCell>,
                                          <TableCell key={`2026_forecast`} className="bg-white">{isMonthlyRow(m26) && typeof m26.forecast === 'number' ? m26.forecast.toFixed(2) : ''}</TableCell>,
                                          <TableCell key={`2026_adjusted`} className="bg-white">{isMonthlyRow(m26) && typeof m26.forecast === 'number' ? (m26.forecast * 1.05).toFixed(2) : ''}</TableCell>,
                                          <TableCell key={`2026_approved`}>
                                            <div className="flex items-center">
                                              {isMonthlyRow(m26) && typeof m26.approvedForecast === 'number' ? (
                                                <input
                                                  type="number"
                                                  className="border border-orange-400 px-2 py-1 rounded-lg w-16 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                                                  value={typeof m26.approvedForecast === 'number' ? m26.approvedForecast.toFixed(2) : ''}
                                                  onChange={e => handleForecastChange(item.item, m26.date ?? '', 'approvedForecast', parseFloat(e.target.value))}
                                                  disabled={lockedRows[item.item]}
                                                />
                                              ) : ''}
                                              <button
                                                onClick={() => toggleLock(item.item)}
                                                className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                                                aria-label={lockedRows[item.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                                                title={lockedRows[item.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                                                type="button"
                                              >
                                                {lockedRows[item.item] ? '🔒' : '🔓'}
                                              </button>
                                            </div>
                                          </TableCell>,
                                          <TableCell key={`2026_percent`} className="bg-white border-r-2 border-orange-300">
                                            {(() => {
                                              const val = m26?.percentChange;
                                              const percentText = formatPercent(val);
                                              if (!percentText) return null;
                                              return (
                                                <span className={
                                                  percentText.startsWith('+')
                                                    ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                                    : percentText.startsWith('-')
                                                      ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                                      : ''
                                                }>
                                                  {percentText}
                                                </span>
                                              );
                                            })()}
                                          </TableCell>
                                        ];
                                      })}
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              ))}
                          </React.Fragment>
                        ))}
                    </React.Fragment>
                  ))}
              </React.Fragment>
            ))}
        </React.Fragment>
      ));
  };

  useEffect(() => {
    const fetchAllMonthlyData = async (year: number) => {
      const updates: Record<string, Record<string, [MonthlyRow?, MonthlyRow?]>> = {};
      await Promise.all(
        data.map(async (row) => {
          const res = await fetch(`${BASE_URL}/api/final-forecast-report/monthly?item=${encodeURIComponent(row.item)}&year=${year}`);
          const monthly = await res.json();
          const merged: Record<string, [MonthlyRow?, MonthlyRow?]> = { ...(monthlyData[`${row.item}_merged`] || {}) };
          for (let i = 0; i < 12; i++) {
            const monthName = monthNames[i];
            if (year === 2025) {
              merged[monthName] = [monthly[i] ?? undefined, (merged[monthName]?.[1]) ?? undefined];
            } else {
              merged[monthName] = [(merged[monthName]?.[0]) ?? undefined, monthly[i] ?? undefined];
            }
          }
          updates[`${row.item}_merged`] = merged;
        })
      );
      setMonthlyData((prev) => ({ ...prev, ...updates }));
    };

    if (expandedYear2025) fetchAllMonthlyData(2025);
    if (expandedYear2026) fetchAllMonthlyData(2026);
    // eslint-disable-next-line
  }, [expandedYear2025, expandedYear2026, data]);

  function handleDownloadBusinessReport() {
    if (!Array.isArray(businessLevelData) || businessLevelData.length === 0) return;
    const header = Object.keys(businessLevelData[0]);
    const rows = businessLevelData.map(row => header.map(h => JSON.stringify(row[h] ?? "")).join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business_level_booking_forecast.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handleClearTable = async () => {
    if (!window.confirm('Are you sure you want to clear the forecast table? This cannot be undone.')) return;
    setClearing(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const res = await fetch(`${BASE_URL}/api/clear-forecast-tables`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to clear forecast tables');
      await fetchForecastReportData(); // Seamless refresh
    } catch (err) {
      alert('Failed to clear forecast tables.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl p-8 mb-10 border border-orange-100">
          <h1 className="text-3xl font-extrabold mb-8 text-center text-orange-900 tracking-tight drop-shadow-sm">
            Forecast Report – Booking Forecast by Year
          </h1>
          <div className="flex justify-between items-center mb-6">
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full text-lg flex items-center gap-2"
              onClick={onBack}
            >
              ← Back to Reports & Analytics
            </button>
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full text-lg flex items-center gap-2"
              onClick={handleClearTable}
              disabled={clearing}
            >
              {clearing ? 'Clearing...' : 'Clear Table'}
            </button>
          </div>
          <div
            ref={tableRefs[0]}
            className="overflow-x-auto w-full border border-orange-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing"
            onMouseDown={e => handleMouseDown(0, e)}
            onMouseMove={e => handleMouseMove(0, e)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <Table className="min-w-max text-sm">
              <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur">
                {/* Row 1: Item (rowSpan=3), Year label, Year headers */}
                <TableRow>
                  <TableHead rowSpan={3} className="bg-orange-100 text-orange-900 font-bold">Item</TableHead>
                  <TableHead className="bg-orange-100 text-orange-900 font-bold">Year</TableHead>
                  <TableHead colSpan={expandedYear2025 ? monthNames.length * 6 : 6} className="bg-orange-100 text-orange-900 font-bold">
                    <button
                      onClick={() => setExpandedYear2025((prev) => !prev)}
                      className="flex items-center gap-2 hover:bg-orange-200 px-2 py-1 rounded transition-colors"
                      aria-label={expandedYear2025 ? 'Collapse 2025' : 'Expand 2025'}
                      title={expandedYear2025 ? 'Collapse 2025' : 'Expand 2025'}
                    >
                      Year 2025
                      <span className={`inline-block transform transition-transform duration-200 ${expandedYear2025 ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                  </TableHead>
                  <TableHead colSpan={expandedYear2026 ? monthNames.length * 6 : 6} className="bg-orange-100 text-orange-900 font-bold">
                    <button
                      onClick={() => setExpandedYear2026((prev) => !prev)}
                      className="flex items-center gap-2 hover:bg-orange-200 px-2 py-1 rounded transition-colors"
                      aria-label={expandedYear2026 ? 'Collapse 2026' : 'Expand 2026'}
                      title={expandedYear2026 ? 'Collapse 2026' : 'Expand 2026'}
                    >
                      Year 2026
                      <span className={`inline-block transform transition-transform duration-200 ${expandedYear2026 ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                  </TableHead>
                </TableRow>
                {/* Row 2: Month headers (only when expanded) */}
                <TableRow>
                  <TableHead className="bg-orange-100 text-orange-900 font-bold">Month</TableHead>
                  {expandedYear2025 ? monthNames.map((month, idx) => (
                    <TableHead
                      key={`2025_${month}_header`}
                      colSpan={6}
                      className="bg-orange-100 text-orange-900 font-bold text-center"
                    >
                      {month} 2025
                    </TableHead>
                  )) : [
                    <TableHead key="2025_year_header" colSpan={6} className="bg-orange-100 text-orange-900 font-bold text-center">Year 2025</TableHead>
                  ]}
                  {expandedYear2026 ? monthNames.map((month, idx) => (
                    <TableHead
                      key={`2026_${month}_header`}
                      colSpan={6}
                      className="bg-orange-100 text-orange-900 font-bold text-center"
                    >
                      {month} 2026
                    </TableHead>
                  )) : [
                    <TableHead key="2026_year_header" colSpan={6} className="bg-orange-100 text-orange-900 font-bold text-center">Year 2026</TableHead>
                  ]}
                </TableRow>
                {/* Row 3: Measure headers */}
                <TableRow>
                  <TableHead className="bg-orange-100 text-orange-900 font-bold">Measure</TableHead>
                  {expandedYear2025 ? monthNames.map((_, mIdx) => ([
                    <TableHead key={`2025_history2Y_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings History 2Y Ago</TableHead>,
                    <TableHead key={`2025_history1Y_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings History 1Y Ago</TableHead>,
                    <TableHead key={`2025_forecast_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings Forecast</TableHead>,
                    <TableHead key={`2025_adjusted_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Adjusted Forecast</TableHead>,
                    <TableHead key={`2025_approved_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Approved Forecast</TableHead>,
                    <TableHead key={`2025_percent_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold border-r-2 border-orange-300">Percent Change</TableHead>
                  ])).flat() : [
                    <TableHead key="2025_history2Y" className="bg-orange-100 text-orange-900 font-bold">Bookings History 2Y Ago (2023)</TableHead>,
                    <TableHead key="2025_history1Y" className="bg-orange-100 text-orange-900 font-bold">Bookings History 1Y Ago (2024)</TableHead>,
                    <TableHead key="2025_forecast" className="bg-orange-100 text-orange-900 font-bold">Bookings Forecast</TableHead>,
                    <TableHead key="2025_adjusted" className="bg-orange-100 text-orange-900 font-bold">Adjusted Forecast</TableHead>,
                    <TableHead key="2025_approved" className="bg-orange-100 text-orange-900 font-bold">Approved Forecast</TableHead>,
                    <TableHead key="2025_percent" className="bg-orange-100 text-orange-900 font-bold">Percent Change</TableHead>
                  ]}
                  {expandedYear2026 ? monthNames.map((_, mIdx) => ([
                    <TableHead key={`2026_history2Y_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings History 2Y Ago</TableHead>,
                    <TableHead key={`2026_history1Y_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings History 1Y Ago</TableHead>,
                    <TableHead key={`2026_forecast_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings Forecast</TableHead>,
                    <TableHead key={`2026_adjusted_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Adjusted Forecast</TableHead>,
                    <TableHead key={`2026_approved_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Approved Forecast</TableHead>,
                    <TableHead key={`2026_percent_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Percent Change</TableHead>
                  ])).flat() : [
                    <TableHead key="2026_history2Y" className="bg-orange-100 text-orange-900 font-bold">Bookings History 2Y Ago (2024)</TableHead>,
                    <TableHead key="2026_history1Y" className="bg-orange-100 text-orange-900 font-bold">Bookings History 1Y Ago (2025)</TableHead>,
                    <TableHead key="2026_forecast" className="bg-orange-100 text-orange-900 font-bold">Bookings Forecast</TableHead>,
                    <TableHead key="2026_adjusted" className="bg-orange-100 text-orange-900 font-bold">Adjusted Forecast</TableHead>,
                    <TableHead key="2026_approved" className="bg-orange-100 text-orange-900 font-bold">Approved Forecast</TableHead>,
                    <TableHead key="2026_percent" className="bg-orange-100 text-orange-900 font-bold">Percent Change</TableHead>
                  ]}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-orange-50/50'} hover:bg-orange-100/60`}>
                    <TableCell className="font-semibold whitespace-nowrap text-orange-900">{row.item}</TableCell>
                    {/* Measure column should be empty */}
                    <TableCell />
                    {/* Data starts here, immediately at Bookings History 2Y Ago (2023) */}
                    {expandedYear2025 ? monthNames.map((month, mIdx) => {
                      const m25 = monthlyData[`${row.item}_merged`]?.[month]?.[0];
                      return [
                        <TableCell key={`2025_${month}_history2Y`}>{isMonthlyRow(m25) && typeof m25.history2Y === 'number' ? m25.history2Y.toFixed(2) : ''}</TableCell>,
                        <TableCell key={`2025_${month}_history1Y`}>{isMonthlyRow(m25) && typeof m25.history1Y === 'number' ? m25.history1Y.toFixed(2) : ''}</TableCell>,
                        <TableCell key={`2025_${month}_forecast`}>{isMonthlyRow(m25) && typeof m25.forecast === 'number' ? m25.forecast.toFixed(2) : ''}</TableCell>,
                        <TableCell key={`2025_${month}_adjusted`}>{isMonthlyRow(m25) && typeof m25.forecast === 'number' ? (m25.forecast * 1.05).toFixed(2) : ''}</TableCell>,
                        <TableCell key={`2025_${month}_approved`}>
                          <div className="flex items-center">
                            {isMonthlyRow(m25) && typeof m25.approvedForecast === 'number' ? (
                              <input
                                type="number"
                                className="border border-orange-300 px-2 py-1 rounded-lg w-16 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                                value={typeof m25.approvedForecast === 'number' ? m25.approvedForecast.toFixed(2) : ''}
                                onChange={e => handleForecastChange(row.item, m25.date ?? '', 'approvedForecast', parseFloat(e.target.value))}
                                disabled={lockedRows[row.item]}
                              />
                            ) : ''}
                            <button
                              onClick={() => toggleLock(row.item)}
                              className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                              aria-label={lockedRows[row.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                              title={lockedRows[row.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                              type="button"
                            >
                              {lockedRows[row.item] ? '🔒' : '🔓'}
                            </button>
                          </div>
                        </TableCell>,
                        <TableCell key={`2025_${month}_percent`} className="border-r-2 border-orange-300">
                          {(() => {
                            const val = m25?.percentChange;
                            const percentText = formatPercent(val);
                            if (!percentText) return null;
                            return (
                              <span className={
                                percentText.startsWith('+')
                                  ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                  : percentText.startsWith('-')
                                    ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                    : ''
                              }>
                                {percentText}
                              </span>
                            );
                          })()}
                        </TableCell>
                      ];
                    }) : [
                      <TableCell key="2025_history2Y">{typeof row.history2023 === 'number' ? row.history2023.toFixed(2) : row.history2023}</TableCell>,
                      <TableCell key="2025_history1Y">{typeof row.history2024 === 'number' ? row.history2024.toFixed(2) : row.history2024}</TableCell>,
                      <TableCell key="2025_forecast">{typeof row.forecast2025 === 'number' ? row.forecast2025.toFixed(2) : row.forecast2025}</TableCell>,
                      <TableCell key="2025_adjusted">{typeof row.adjustedForecast2025 === 'number' ? row.adjustedForecast2025.toFixed(2) : row.adjustedForecast2025}</TableCell>,
                      <TableCell key="2025_approved">
                        <div className="flex items-center">
                          <input
                            type="number"
                            className="border border-orange-300 px-2 py-1 rounded-lg w-16 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                            value={typeof row.approvedForecast2025 === 'number' ? row.approvedForecast2025.toFixed(2) : row.approvedForecast2025}
                            onChange={e => handleForecastChange(row.item, null, 'approvedForecast2025', parseFloat(e.target.value))}
                            disabled={lockedRows[row.item]}
                          />
                          <button
                            onClick={() => toggleLock(row.item)}
                            className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                            aria-label={lockedRows[row.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                            title={lockedRows[row.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                            type="button"
                          >
                            {lockedRows[row.item] ? '🔒' : '🔓'}
                          </button>
                        </div>
                      </TableCell>,
                      <TableCell key="2025_percent" className="border-r-2 border-orange-300">{typeof row.percentChange2025 === 'number' ? <span className="inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs">+{row.percentChange2025.toFixed(2)}%</span> : row.percentChange2025 < 0 ? <span className="inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs">{row.percentChange2025.toFixed(2)}%</span> : ''}</TableCell>
                    ]}
                    {expandedYear2026 ? monthNames.map((month, mIdx) => {
                      const m26 = monthlyData[`${row.item}_merged`]?.[month]?.[1];
                      return [
                        <TableCell key={`2026_${month}_history2Y`}>{isMonthlyRow(m26) && typeof m26.history2Y === 'number' ? m26.history2Y.toFixed(2) : ''}</TableCell>,
                        <TableCell key={`2026_${month}_history1Y`}>{isMonthlyRow(m26) && typeof m26.history1Y === 'number' ? m26.history1Y.toFixed(2) : ''}</TableCell>,
                        <TableCell key={`2026_forecast`}>{isMonthlyRow(m26) && typeof m26.forecast === 'number' ? m26.forecast.toFixed(2) : ''}</TableCell>,
                        <TableCell key={`2026_adjusted`}>{isMonthlyRow(m26) && typeof m26.forecast === 'number' ? (m26.forecast * 1.05).toFixed(2) : ''}</TableCell>,
                        <TableCell key={`2026_approved`}>
                          <div className="flex items-center">
                            {isMonthlyRow(m26) && typeof m26.approvedForecast === 'number' ? (
                              <input
                                type="number"
                                className="border border-orange-400 px-2 py-1 rounded-lg w-16 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                                value={typeof m26.approvedForecast === 'number' ? m26.approvedForecast.toFixed(2) : ''}
                                onChange={e => handleForecastChange(row.item, m26.date ?? '', 'approvedForecast', parseFloat(e.target.value))}
                                disabled={lockedRows[row.item]}
                              />
                            ) : ''}
                            <button
                              onClick={() => toggleLock(row.item)}
                              className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                              aria-label={lockedRows[row.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                              title={lockedRows[row.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                              type="button"
                            >
                              {lockedRows[row.item] ? '🔒' : '🔓'}
                            </button>
                          </div>
                        </TableCell>,
                        <TableCell key={`2026_percent`} className="border-r-2 border-orange-300">
                          {(() => {
                            const val = m26?.percentChange;
                            const percentText = formatPercent(val);
                            if (!percentText) return null;
                            return (
                              <span className={
                                percentText.startsWith('+')
                                  ? 'inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs'
                                  : percentText.startsWith('-')
                                    ? 'inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs'
                                    : ''
                              }>
                                {percentText}
                              </span>
                            );
                          })()}
                        </TableCell>
                      ];
                    }) : [
                      <TableCell key="2026_history2Y">{typeof row.history2024_2026 === 'number' ? row.history2024_2026.toFixed(2) : row.history2024_2026}</TableCell>,
                      <TableCell key="2026_history1Y">{typeof row.history2025_2026 === 'number' ? row.history2025_2026.toFixed(2) : row.history2025_2026}</TableCell>,
                      <TableCell key="2026_forecast">{typeof row.forecast2026 === 'number' ? row.forecast2026.toFixed(2) : row.forecast2026}</TableCell>,
                      <TableCell key="2026_adjusted">{typeof row.adjustedForecast2026 === 'number' ? row.adjustedForecast2026.toFixed(2) : row.adjustedForecast2026}</TableCell>,
                      <TableCell key="2026_approved">
                        <div className="flex items-center">
                          <input
                            type="number"
                            className="border border-orange-400 px-2 py-1 rounded-lg w-16 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                            value={typeof row.approvedForecast2026 === 'number' ? row.approvedForecast2026.toFixed(2) : row.approvedForecast2026}
                            onChange={e => handleForecastChange(row.item, null, 'approvedForecast2026', parseFloat(e.target.value))}
                            disabled={lockedRows[row.item]}
                          />
                          <button
                            onClick={() => toggleLock(row.item)}
                            className="ml-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
                            aria-label={lockedRows[row.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                            title={lockedRows[row.item] ? 'Unlock Approved Forecast' : 'Lock Approved Forecast'}
                            type="button"
                          >
                            {lockedRows[row.item] ? '🔒' : '🔓'}
                          </button>
                        </div>
                      </TableCell>,
                      <TableCell key="2026_percent" className="border-r-2 border-orange-300">{typeof row.percentChange2026 === 'number' ? <span className="inline-block bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs">+{row.percentChange2026.toFixed(2)}%</span> : row.percentChange2026 < 0 ? <span className="inline-block bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs">{row.percentChange2026.toFixed(2)}%</span> : ''}</TableCell>
                    ]}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-8 mt-10 border border-orange-100">
          <div className="flex items-center mb-4">
            <div className="mr-4">
              <label htmlFor="customer-class-code-filter" className="block text-xs font-semibold text-orange-900 mb-1">Customer Class Code</label>
              <select
                id="customer-class-code-filter"
                className="border border-orange-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={selectedCustomerClassCode}
                onChange={e => setSelectedCustomerClassCode(e.target.value)}
              >
                <option value="">All</option>
                {customerClassCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleDownloadBusinessReport}
              className="ml-auto px-4 py-2 bg-orange-600 text-white text-base font-semibold rounded-full shadow hover:bg-orange-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              Download Report
            </button>
            <h2 className="text-2xl font-extrabold flex-1 text-center text-orange-900 tracking-tight drop-shadow-sm">
              Forecast Report – Business Level Booking Forecast
            </h2>
          </div>
          <div
            style={{
              height: 800, // changed from 400 to 800
              overflow: 'auto',
              position: 'relative',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #fbbf24', // Tailwind orange-200
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}
          >
            <table style={{ minWidth: 1200, width: '100%' }}>
              <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur">
                {/* Row 1: Item, Year headers */}
                <TableRow className="bg-orange-100 text-center font-bold text-orange-900">
                  <TableHead rowSpan={3} className="bg-orange-100 text-orange-900 font-bold">Business Unit</TableHead>
                  {/* Removed Family, Subfamily, Color, Item headers */}
                  <TableHead colSpan={businessExpandedYear2025 ? monthNames.length * 6 : 6} className="bg-orange-100 text-orange-900 font-bold">
                    <button
                      onClick={() => setBusinessExpandedYear2025((prev) => !prev)}
                      className="flex items-center gap-2 hover:bg-orange-200 px-2 py-1 rounded transition-colors"
                      aria-label={businessExpandedYear2025 ? 'Collapse 2025' : 'Expand 2025'}
                      title={businessExpandedYear2025 ? 'Collapse 2025' : 'Expand 2025'}
                    >
                      Year 2025
                      <span className={`inline-block transform transition-transform duration-200 ${businessExpandedYear2025 ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                  </TableHead>
                  <TableHead colSpan={businessExpandedYear2026 ? monthNames.length * 6 : 6} className="bg-orange-100 text-orange-900 font-bold">
                    <button
                      onClick={() => setBusinessExpandedYear2026((prev) => !prev)}
                      className="flex items-center gap-2 hover:bg-orange-200 px-2 py-1 rounded transition-colors"
                      aria-label={businessExpandedYear2026 ? 'Collapse 2026' : 'Expand 2026'}
                      title={businessExpandedYear2026 ? 'Collapse 2026' : 'Expand 2026'}
                    >
                      Year 2026
                      <span className={`inline-block transform transition-transform duration-200 ${businessExpandedYear2026 ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                  </TableHead>
                </TableRow>
                {/* Row 2: Month headers for expanded years */}
                <TableRow className="bg-orange-100 text-center text-xs font-bold text-orange-900">
                  <TableHead className="bg-orange-100 text-orange-900 font-bold">Month</TableHead>
                  {businessExpandedYear2025 ? monthNames.map((month, idx) => (
                    <TableHead
                      key={`2025_${month}_header`}
                      colSpan={6}
                      className="bg-orange-100 text-orange-900 font-bold text-center"
                    >
                      {month} 2025
                    </TableHead>
                  )) : [
                    <TableHead key="2025_year_header" colSpan={6} className="bg-orange-100 text-orange-900 font-bold text-center">Year 2025</TableHead>
                  ]}
                  {businessExpandedYear2026 ? monthNames.map((month, idx) => (
                    <TableHead
                      key={`2026_${month}_header`}
                      colSpan={6}
                      className="bg-orange-100 text-orange-900 font-bold text-center"
                    >
                      {month} 2026
                    </TableHead>
                  )) : [
                    <TableHead key="2026_year_header" colSpan={6} className="bg-orange-100 text-orange-900 font-bold text-center">Year 2026</TableHead>
                  ]}
                </TableRow>
                {/* Row 3: Measure/metric headers for each month */}
                <TableRow className="bg-orange-100 text-center text-xs font-bold text-orange-900">
                  <TableHead className="bg-orange-100 text-orange-900 font-bold">Measure</TableHead>
                  {businessExpandedYear2025 ? monthNames.map((_, mIdx) => ([
                    <TableHead key={`2025_history2Y_${mIdx}`}>Bookings History 2Y Ago</TableHead>,
                    <TableHead key={`2025_history1Y_${mIdx}`}>Bookings History 1Y Ago</TableHead>,
                    <TableHead key={`2025_forecast_${mIdx}`}>Bookings Forecast</TableHead>,
                    <TableHead key={`2025_adjusted_${mIdx}`}>Adjusted Forecast</TableHead>,
                    <TableHead key={`2025_approved_${mIdx}`}>Approved Forecast</TableHead>,
                    <TableHead key={`2025_percent_${mIdx}`} className="border-r-2 border-orange-300">Percent Change</TableHead>
                  ])).flat() : [
                    <TableHead key="2025_history2Y">Bookings History 2Y Ago (2023)</TableHead>,
                    <TableHead key="2025_history1Y">Bookings History 1Y Ago (2024)</TableHead>,
                    <TableHead key="2025_forecast">Bookings Forecast</TableHead>,
                    <TableHead key="2025_adjusted">Adjusted Forecast</TableHead>,
                    <TableHead key="2025_approved">Approved Forecast</TableHead>,
                    <TableHead key="2025_percent">Percent Change</TableHead>
                  ]}
                  {businessExpandedYear2026 ? monthNames.map((_, mIdx) => ([
                    <TableHead key={`2026_history2Y_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings History 2Y Ago (2024)</TableHead>,
                    <TableHead key={`2026_history1Y_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings History 1Y Ago (2025)</TableHead>,
                    <TableHead key={`2026_forecast_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Bookings Forecast</TableHead>,
                    <TableHead key={`2026_adjusted_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Adjusted Forecast</TableHead>,
                    <TableHead key={`2026_approved_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Approved Forecast</TableHead>,
                    <TableHead key={`2026_percent_${mIdx}`} className="bg-orange-100 text-orange-900 font-bold">Percent Change</TableHead>
                  
                  ])).flat() : [
                    <TableHead></TableHead>,
                    <TableHead key="2026_history2Y" className="bg-orange-100 text-orange-900 font-bold">Bookings History 2Y Ago (2024)</TableHead>,
                    <TableHead key="2026_history1Y" className="bg-orange-100 text-orange-900 font-bold">Bookings History 1Y Ago (2025)</TableHead>,
                    <TableHead key="2026_forecast" className="bg-orange-100 text-orange-900 font-bold">Bookings Forecast</TableHead>,
                    <TableHead key="2026_adjusted" className="bg-orange-100 text-orange-900 font-bold">Adjusted Forecast</TableHead>,
                    <TableHead key="2026_approved" className="bg-orange-100 text-orange-900 font-bold">Approved Forecast</TableHead>,
                    <TableHead key="2026_percent" className="bg-orange-100 text-orange-900 font-bold">Percent Change</TableHead>
                  ]}
                </TableRow>
              </thead>
              <tbody>
                {renderBusinessLevelTable()}
              </tbody>
            </table>
            {/* Always show horizontal scrollbar */}
            <div
              style={{
                height: 16,
                overflowX: 'scroll',
                overflowY: 'hidden',
                width: '100%',
                position: 'absolute',
                left: 0,
                bottom: 0,
                background: 'white'
              }}
            >
              <div style={{ width: 1200 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageTablesReportPage;