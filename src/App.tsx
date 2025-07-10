import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Home, 
  Calendar, 
  Database, 
  Grid, 
  Package, 
  Warehouse, 
  Ruler,
  Building2,
  Users,
  User,
  Table as TableIcon,
  LineChart,
  Plus,
  Search,
  Trash2,
  X,
  Save,
  Edit2,
  Play,
  Upload,
  AlertCircle
} from 'lucide-react';
import Plot from 'react-plotly.js';
import { FileUpload } from './components/FileUpload';
import Calendars from './components/Calendars';
import DemandClasses from './components/DemandClasses';
import ItemColors from './components/ItemColors';
import CustomerNames from './components/CustomerNames';
import Organizations from './components/Organizations';
import UsersList from './components/Users';
import UnitsOfMeasure from './components/UnitsOfMeasure';
import ItemSubinventories from './components/ItemSubinventories';
import CollectedMeasure from './components/CollectedMeasure';
import NewForecastForm from './components/NewForecastForm';
import TimeGPTForecastRunner from './components/TimeGPTForecastRunner';
import ForecastReportTable from './components/ForecastReportTable';
import ManageTables from './components/ManageTables';
import { format } from 'date-fns';
import { unparse } from "papaparse";
import MergeAndUploadButton from './components/MergeAndUploadButton';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ManageTablesReportPage from './components/ManageTablesReportPage';
import { Card, CardContent } from '@/components/utils/card';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

type DemandPlan = {
  id: number;
  name: string;
  description?: string;
  owner?: string;
  product: string;
  status: 'Active' | 'Draft' | 'Running';
  customers?: {
    hierarchy: string;
    level: string;
  };
  organizations?: {
    hierarchy: string;
    level: string;
  };
  items?: {
    hierarchy: string;
    level: string;
  };
  demandClasses?: {
    hierarchy: string;
  };
  planParameters?: {
    planHorizonDays: number;
    planningCalendar: string;
    planningTimeLevel: string;
  };
};

const initialDemandPlans: DemandPlan[] = [
  { id: 1, name: 'Q1 2025 Forecast', product: 'Product A', status: 'Active' },
  { id: 2, name: 'Q2 2025 Forecast', product: 'Product B', status: 'Draft' },
];

type Tab = 'demand-plan-inputs' | 'supply-network-model' | 'manage-demand-plans' | 'manage-users' | 'reports-analytics' | 'new-forecast' | 'edit-forecast';

function NavigationTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { path: '/DemandPlanInputs', label: 'Demand Plan Inputs' },
    { path: '/SupplyNetworkModel', label: 'Supply Network Model' },
    { path: '/ManageDemandPlans', label: 'Manage Demand Plans' },
    { path: '/ManageUsers', label: 'Manage Users' },
    { path: '/ReportsAnalytics', label: 'Reports & Analytics' },
  ];
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${location.pathname === tab.path ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'}`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function App() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('starts-with');
  
  const [demandPlans, setDemandPlans] = useState<DemandPlan[]>(initialDemandPlans);
  const [searchResults, setSearchResults] = useState<DemandPlan[]>(demandPlans);
  const [selectedPlan, setSelectedPlan] = useState<DemandPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<DemandPlan | null>(null);
  const [isRunningForecast, setIsRunningForecast] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showDemandClassesModal, setShowDemandClassesModal] = useState(false);
  const [showItemColorsModal, setShowItemColorsModal] = useState(false);
  const [showCustomerNamesModal, setShowCustomerNamesModal] = useState(false);
  const [showOrganizationsModal, setShowOrganizationsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showSubinventoriesModal, setShowSubinventoriesModal] = useState(false);
  const [showCollectedMeasureModal, setShowCollectedMeasureModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [forecastFiles, setForecastFiles] = useState<any[]>([]);
  const [selectedForecastFile, setSelectedForecastFile] = useState<string | null>(null);
  const [showForecastDateModal, setShowForecastDateModal] = useState(false);
  const [dateSelectionMode, setDateSelectionMode] = useState('duration');
  const [forecastMonths, setForecastMonths] = useState(12);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(0);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(11)
  const [showViewResultModal, setShowViewResultModal] = useState(false);
  const [forecastTableData, setForecastTableData] = useState<{ 
    PRD_LVL_MEMBER_NAME: string;
    TIM_LVL_MEMBER_VALUE: string;
    ForecastAI: number;
  }[]>([]);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedOriginalFile, setSelectedOriginalFile] = useState<string | null>(null);
  const [showReportPage, setShowReportPage] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [selectedGraphItem, setSelectedGraphItem] = useState<string>('');
  const [graphMonthlyData, setGraphMonthlyData] = useState<any[]>([]);
  const [forecastReportData, setForecastReportData] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forecastResultFiles, setForecastResultFiles] = useState<any[]>([]);
  const [loadingResultFiles, setLoadingResultFiles] = useState(false);
  const [resultSearchTerm, setResultSearchTerm] = useState('');
  const [selectedResultFile, setSelectedResultFile] = useState<string | null>(null);
  const [searchResultsTerm, setSearchResultsTerm] = useState('');
  const [runReportLoading, setRunReportLoading] = useState(false);
  const [runReportMessage, setRunReportMessage] = useState('');

  // Sync Option 2 back to Option 1 when user selects custom date range
  useEffect(() => {
    const start = new Date(startYear, startMonth);
    const end = new Date(endYear, endMonth);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

    if (dateSelectionMode === 'range') {
      setForecastMonths(diffMonths);
    }
  }, [startYear, startMonth, endYear, endMonth, dateSelectionMode]);

  useEffect(() => {
    fetchSavedForecasts();
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/forecast-files`)
      .then(res => res.json())
      .then(setForecastFiles)
      .catch(err => console.error('Failed to load S3 forecast files:', err));
  }, []);
    
  useEffect(() => {
    const handleStorageChange = () => {
      // Removed getMergedData() call - function not defined
      // setMockData(updatedData);
      
      // setSelectedValues(prev => ({
      //   ...prev,
      //   customers: {
      //     hierarchy: updatedData.customers.hierarchies[0],
      //     level: updatedData.customers.levels[0]
      //   },
      //   organizations: {
      //     hierarchy: updatedData.organizations.hierarchies[0],
      //     level: updatedData.organizations.levels[0]
      //   },
      //   items: {
      //     hierarchy: updatedData.items.hierarchies[0],
      //     level: updatedData.items.levels[0]
      //   }
      // }));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchSavedForecasts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/list-forecasts`);
      const data = await res.json();
      
      if (!res.ok) {
        // Handle specific error cases
        if (data.code === 'S3_ACCESS_DENIED') {
          setToast('⚠️ AWS S3 Access Denied: Please check IAM permissions for the S3 bucket.');
        } else if (data.code === 'S3_BUCKET_NOT_FOUND') {
          setToast('❌ S3 Bucket Not Found: Please verify the bucket name in environment variables.');
        } else {
          setToast(`❌ Error: ${data.error || 'Failed to load forecast files'}`);
        }
        setForecastFiles([]);
        return;
      }
      
      setForecastFiles(data);
    } catch (err) {
      console.error('[Fetch Forecast Files]', err);
      setToast('❌ Network Error: Unable to connect to the server.');
      setForecastFiles([]);
    }
  };
 
  const handleSave = async () => {
    if (!selectedValues.name) {
      alert('Please enter a name');
      return;
    }

    const newPlan: DemandPlan = {
      id: demandPlans.length + 1,
      name: selectedValues.name,
      description: selectedValues.description,
      owner: selectedValues.owner,
      product: 'Product A',
      status: 'Draft',
      customers: selectedValues.customers,
      organizations: selectedValues.organizations,
      items: selectedValues.items,
      demandClasses: selectedValues.demandClasses,
      planParameters: selectedValues.planParameters
    };

    const saved = saveToLocalStorage(newPlan);
    
    if (saved) {
      setDemandPlans(prev => [...prev, newPlan]);
      setSearchResults(prev => [...prev, newPlan]);
      navigate('/ManageDemandPlans');
      setSelectedValues(prev => ({
        ...prev,
        name: '',
        description: ''
      }));
    } else {
      alert('Error saving plan');
    }
  };

  const handleDuplicate = async () => {
    if (!selectedForecastFile) return;
    try {
      const filenameOnly = selectedForecastFile.replace(/^forecasts\//, '');
      const response = await fetch(`${BASE_URL}/api/duplicate-forecast?file=${encodeURIComponent(filenameOnly)}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to duplicate file');
      await fetchSavedForecasts(); // reload list
      await fetchForecastFiles();
      await fetchForecastResultFiles();
      navigate('/ManageDemandPlans');
    } catch (err) {
      console.error('[Duplicate File] Error:', err);
    }
  };
  
  
  const handleDeleteFile = async (fileName: string) => {
    const confirmed = window.confirm(`Delete ${fileName}?`);
    if (!confirmed) return;
  
    try {
      const res = await fetch(`${BASE_URL}/api/delete-file?key=forecasts/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
      });
  
      if (!res.ok) throw new Error('Failed to delete');
  
      alert(`${fileName} deleted`);
      fetchSavedForecasts();
      await fetchForecastFiles();
      await fetchForecastResultFiles();
      navigate('/ManageDemandPlans');
    } catch (err) {
      console.error('[Delete File]', err);
      alert('Error deleting file');
    }
  };
  
  const handlePreviewFile = async (fileName: string) => {
  try {
    const res = await fetch(`${BASE_URL}/api/read-forecast-csv?key=forecasts/${encodeURIComponent(fileName)}`);
    const text = await res.text();

    const rows = text
      .trim()
      .split("\n")
      .slice(0, 6) // header + 5 rows
      .map(line => line.split(","));

    const headers = rows[0];
    const preview = rows.slice(1).map(row =>
      Object.fromEntries(row.map((cell, i) => [headers[i], cell]))
    );

    setPreviewData(preview);
    setShowPreviewModal(true);
  } catch (err) {
    console.error("[Preview File] Error:", err);
    alert("Failed to load preview data");
  }
};

  const handleSearch = () => {
    let filtered = [...demandPlans];
    if (searchTerm) {
      filtered = demandPlans.filter(plan => {
        const name = plan.name.toLowerCase();
        const term = searchTerm.toLowerCase();
        switch (searchType) {
          case 'starts-with':
            return name.startsWith(term);
          case 'contains':
            return name.includes(term);
          case 'equals':
            return name === term;
          default:
            return true;
        }
      });
    }
    setSearchResults(filtered);
  };

  const navigateHome = () => {
    navigate('/DemandPlanInputs');
  };

  const handleFileUploadSuccess = (filename: string) => {
    console.log('File uploaded:', filename);
    // Removed getMergedData() call - function not defined
    // setMockData(updatedData);
  };

  const Modal = ({ isOpen, onClose, title, children }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const DemandPlanInputs = () => (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowCalendarModal(true)}>
        <Calendar className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Calendar Values</span>
      </div>
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowCollectedMeasureModal(true)}>
        <Database className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Collected Measure Data</span>
      </div>
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowDemandClassesModal(true)}>
        <Grid className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Demand Classes</span>
      </div>
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowItemColorsModal(true)}>
        <Package className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Items</span>
      </div>
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowSubinventoriesModal(true)}>
        <Warehouse className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Item Subinventories</span>
      </div>
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowUnitsModal(true)}>
        <Ruler className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Units of Measure</span>
      </div>
      <div className="bg-white rounded-lg border-2 border-orange-200 shadow-sm p-8 flex flex-col items-center justify-center text-center">
        <FileUpload
          accept=".csv,.json"
          onUploadSuccess={handleFileUploadSuccess}
          onUploadError={(error) => {
            console.error('Upload error:', error);
            alert(error);
          }}
        />
      </div>
    </div>
  );

  const SupplyNetworkModel = () => (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowOrganizationsModal(true)}>
        <Building2 className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Organizations</span>
      </div>
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowCustomerNamesModal(true)}>
        <Users className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Customers</span>
      </div>
    </div>
  );

  const ManageUsers = () => (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group" onClick={() => setShowUsersModal(true)}>
        <Users className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
        <span className="text-lg font-semibold text-black">Users</span>
      </div>
    </div>
  );

  const ReportsAnalytics = ({
    forecastTableData,
    onShowReport,
  }: {
    forecastTableData: any[];
    onShowReport: () => void;
  }) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6">
        <div
          onClick={() => setShowReportPage(true)}
          className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group"
        >
          <TableIcon className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
          <span className="text-lg font-semibold text-black">Manage Tables</span>
        </div>
        <div
          onClick={() => setShowGraphModal(true)}
          className="cursor-pointer flex flex-col items-center justify-center bg-white rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all p-8 text-center group"
        >
          <LineChart className="w-16 h-16 text-orange-500 mb-4 group-hover:text-orange-600 transition-colors" />
          <span className="text-lg font-semibold text-black">Manage Graphs</span>
        </div>
      </div>
    );
  };

  const ManageDemandPlans = ({ handleDelete }: { handleDelete: (fileName: string) => void }) => (
    <div className="p-6 min-h-screen bg-white relative">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-100 text-green-800 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <span>✅ {toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-lg">×</button>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-orange-200">
          <div className="p-8 border-b border-orange-200 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-extrabold text-black tracking-tight">Manage Demand Plans</h2>
            <button
              onClick={() => navigate('/NewForecast')}
                className="fixed md:static bottom-8 right-8 z-40 bg-orange-500 text-white py-3 px-6 rounded-full shadow-lg hover:bg-orange-600 transition-all flex items-center gap-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300"
                title="Create a new forecast file"
            >
                <Plus className="w-6 h-6" /> New Forecast
            </button>
          </div>
            {/* <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-orange-900 mb-1">Original File for Merge</label>
            <select
              value={selectedOriginalFile}
              onChange={(e) => setSelectedOriginalFile(e.target.value)}
              className="p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full"
            >
              <option value="">Select original file...</option>
              {forecastFiles.map(file => (
                <option key={file.key} value={file.key}>
                  {file.name}
                </option>
              ))}
            </select>
          </div>
            <button 
              onClick={handleSearch}
                className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                title="Search demand plans"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div> */}
        </div>
          <div className="p-8">
            <h3 className="text-lg font-bold mb-4 text-black">Search Results</h3>
            <div className="flex items-end gap-2 mb-4">
              <input
                type="text"
                value={searchResultsTerm}
                onChange={e => setSearchResultsTerm(e.target.value)}
                className="flex-1 p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Search by name..."
              />
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
                onClick={() => {/* Optionally trigger a search, or just filter as you type */}}
              >
                <Search className="w-4 h-4 inline-block mr-1" /> Search
              </button>
            </div>
          <div className="flex gap-2 mb-4">
            <button
                className={`p-2 rounded ${selectedForecastFile ? 'text-orange-500 hover:bg-orange-50' : 'text-gray-400 cursor-not-allowed'}`}
              onClick={() => handleDuplicate(selectedForecastFile)}
              disabled={!selectedForecastFile}
                title={selectedForecastFile ? 'Duplicate selected file' : 'Select a file to duplicate'}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
                className={`p-2 rounded ${selectedForecastFile ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'}`}
              onClick={() => handleDelete(selectedForecastFile)}
              disabled={!selectedForecastFile}
                title={selectedForecastFile ? 'Delete selected file' : 'Select a file to delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
            <div className="relative">
              {loadingFiles && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                </div>
              )}
              <table className="w-full rounded-xl overflow-hidden shadow-sm">
                <thead className="sticky top-0 z-10 bg-orange-50/90">
              <tr className="border-b-2 border-orange-200">
                <th className="text-left py-2 px-4 text-black font-bold">Name</th>
                <th className="text-left py-2 px-4 text-black font-bold">Owner</th>
                <th className="text-left py-2 px-4 text-black font-bold">Status</th>
                <th className="text-left py-2 px-4 text-black font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
                  {filteredOriginalFiles.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-orange-400 py-8">No demand plans found.</td></tr>
                  ) : filteredOriginalFiles.map((file, idx) => (
                <tr
                  key={file.key}
                      className={`border-b border-orange-100 cursor-pointer transition-colors ${selectedForecastFile === file.key ? 'bg-orange-100 border-l-4 border-orange-400' : idx % 2 === 0 ? 'bg-white' : 'bg-orange-50/50'} hover:bg-orange-100`}
                      onClick={() => setSelectedForecastFile(file.key)}
                      title={file.name}
                >
                      <td className="py-2 px-4 max-w-xs truncate" title={file.name}>{file.name}</td>
                  <td className="py-2 px-4">{file.owner}</td>
                  <td className="py-2 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold border
                          ${file.status === 'Active' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                          file.status === 'Draft' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'}`}
                        >
                          {file.status}
                        </span>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handlePreviewFile(file.name)}
                        className="text-orange-600 hover:underline text-sm font-semibold"
                        title="Preview file"
                        disabled={!selectedForecastFile || selectedForecastFile !== file.key}
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownloadResult(file.name)}
                        className="text-orange-600 hover:underline text-sm font-semibold"
                        title="Download file"
                        disabled={!selectedForecastFile || selectedForecastFile !== file.key}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.name)}
                        className="text-red-500 hover:underline text-sm font-semibold"
                        title="Delete file"
                        disabled={!selectedForecastFile || selectedForecastFile !== file.key}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
            <div className="mt-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-end items-center">
            <button
              onClick={() => {
                if (!selectedForecastFile) {
                    setToast('Please select a file first.');
                  return;
                }
                setShowForecastDateModal(true);
              }}
              disabled={!selectedForecastFile || isRunningForecast || loading}
                className={`py-2 px-4 rounded-md flex items-center gap-2 font-semibold shadow-sm transition-all
                  ${selectedForecastFile && !isRunningForecast && !loading
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                title={selectedForecastFile ? 'Run forecast on selected file' : 'Select a file to run forecast'}
            >
              <Play className="w-4 h-4" />
              {(isRunningForecast || loading) && <span className="spinner" style={{ marginRight: 8 }} />}
              {(isRunningForecast || loading) ? 'Running Forecast...' : 'Run Forecast'}
            </button>
            </div>
            {runReportMessage && <p className="text-sm">{runReportMessage}</p>}
            {/* Forecast Result Files Table - moved here */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-black">Forecast Result Files</h3>
              <div className="flex items-end gap-2 mb-4 mt-2">
                <input
                  type="text"
                  value={resultSearchTerm}
                  onChange={e => setResultSearchTerm(e.target.value)}
                  className="flex-1 p-2 border border-orange-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Search by name..."
                />
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
                  onClick={() => {/* Optionally trigger a search, or just filter as you type */}}
                >
                  <Search className="w-4 h-4 inline-block mr-1" /> Search
                </button>
              </div>
              <div className="flex gap-2 mb-4 mt-2">
                <button
                  className={`p-2 rounded ${selectedResultFile ? 'text-orange-500 hover:bg-orange-50' : 'text-gray-400 cursor-not-allowed'}`}
                  onClick={() => handleDuplicateResult(selectedResultFile)}
                  disabled={!selectedResultFile}
                  title={selectedResultFile ? 'Duplicate selected file' : 'Select a file to duplicate'}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 rounded ${selectedResultFile ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'}`}
                  onClick={() => handleDeleteResult(selectedResultFile)}
                  disabled={!selectedResultFile}
                  title={selectedResultFile ? 'Delete selected file' : 'Select a file to delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="relative mt-4">
                {loadingResultFiles && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                  </div>
                )}
                <table className="w-full rounded-xl overflow-hidden shadow-sm">
                  <thead className="sticky top-0 z-10 bg-orange-50/90">
                    <tr className="border-b-2 border-orange-200">
                      <th className="text-left py-2 px-4 text-black font-bold">Name</th>
                      <th className="text-left py-2 px-4 text-black font-bold">Owner</th>
                      <th className="text-left py-2 px-4 text-black font-bold">Status</th>
                      <th className="text-left py-2 px-4 text-black font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResultFiles.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-orange-400 py-8">No forecast results found.</td></tr>
                    ) : filteredResultFiles.map((file, idx) => (
                      <tr
                        key={file.key}
                        onClick={() => setSelectedResultFile(file.key)}
                        className={`border-b border-orange-100 cursor-pointer transition-colors ${selectedResultFile === file.key ? 'bg-orange-100 border-l-4 border-orange-400' : idx % 2 === 0 ? 'bg-white' : 'bg-orange-50/50'}`}
                        title={file.name}
                      >
                        <td className="py-2 px-4 max-w-xs truncate" title={file.name}>{file.name}</td>
                        <td className="py-2 px-4">{file.owner}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold border
                            ${file.status === 'Active' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                            file.status === 'Draft' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'}`}
                          >
                            {file.status}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex gap-4">
                            <button
                              onClick={() => handlePreviewResult(file.key)}
                              className="text-orange-600 hover:underline text-sm font-semibold"
                              title="Preview file"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleDownloadResult(file.key)}
                              className="text-orange-600 hover:underline text-sm font-semibold"
                              title="Download file"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleDeleteResult(file.key)}
                              className="text-red-500 hover:underline text-sm font-semibold"
                              title="Delete file"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-end items-center">
                  <button
                    className={`py-2 px-4 rounded-md flex items-center gap-2 font-semibold shadow-sm transition-all ${selectedResultFile && !runReportLoading ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    onClick={handleRunReport}
                    disabled={!selectedResultFile || runReportLoading}
                    title={selectedResultFile ? 'Run report on selected result file' : 'Select a file to run report'}
                  >
                    <Play className="w-4 h-4" />
                    {runReportLoading ? 'Uploading to Tables...' : 'Run Report'}
                  </button>
                </div>
                {runReportMessage && <p className="text-sm">{runReportMessage}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleRunForecast = async (startDate: string, endDate: string) => {
    if (!selectedForecastFile) {
      alert('Please select a file first');
      return;
    }

    setLoading(true);
    const fileBase = selectedForecastFile.split('/').pop()?.replace('.csv', '') || 'forecast';

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const payload = {
        originalFileName: fileBase,
        horizon: Math.round(((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))),
        id: fileBase
      };

      console.log('🚀 Starting forecast with payload:', payload);

      const res = await fetch(`${BASE_URL}/api/run-forecast-py`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Forecast failed");

      const result = await res.json();
      console.log("🔍 TimeGPT Raw Result:", result);

      if (!result || !Array.isArray(result) || result.length === 0) {
        alert(" ✅ Forecast Completed.");
        navigate('/ManageDemandPlans');
        return;
      }

      const convertedResult = result.map(row => ({
        PRD_LVL_MEMBER_NAME: row.unique_id,
        TIM_LVL_MEMBER_VALUE: new Date(row.ds).toLocaleDateString("en-US"),
        ForecastAI: row.TimeGPT
      }));

      setForecastTableData(convertedResult);
      setShowViewResultModal(true);

      // Upload the forecast result via backend API instead of direct S3
      const csvHeader = Object.keys(convertedResult[0]).join(",");
      const csvRows = convertedResult.map(r => Object.values(r).join(","));
      const csvData = [csvHeader, ...csvRows].join("\n");
      
      const forecastFileName = `Forecast_${fileBase}_${new Date().toISOString().split("T")[0]}.csv`;
      const blob = new Blob([csvData], { type: 'text/csv' });
      const forecastFile = new File([blob], forecastFileName, { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', forecastFile);
      formData.append('owner', 'ForecastAI');
      formData.append('description', `Forecast generated for ${fileBase}.csv`);

      try {
        const uploadResponse = await fetch(`${BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload forecast result');
        }

        console.log("✅ Forecast result uploaded successfully");
        alert("✅ Forecast uploaded to S3! View it in Reports & Analytics → Manage Tables.");
      } catch (uploadError) {
        console.error("❌ Upload Failed:", uploadError);
        alert("Forecast complete but failed to upload to S3.");
      }
      
      await fetchForecastFiles();
      await fetchForecastResultFiles();
      navigate('/ManageDemandPlans');

    } catch (err: any) {
      console.error("❌ Forecast error:", err);
      alert("Forecast failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleRunReport = async () => {
    if (!selectedResultFile) {
      setRunReportMessage('❌ Please select a forecast result file.');
      return;
    }
    // Extract original name from forecast result file name
    const forecastResultName = selectedResultFile.split('/').pop() || '';
    // Expected format: Forecast_<OriginalName>_<Date>.csv
    const match = forecastResultName.match(/^Forecast_(.+)_\d{4}-\d{2}-\d{2}\.csv$/);
    if (!match) {
      setRunReportMessage('❌ Could not determine original file from forecast result file name.');
      return;
    }
    const originalName = match[1] + '.csv';
    // Find the original file in forecastFiles
    const originalFile = forecastFiles.find(f => f.name === originalName);
    if (!originalFile) {
      setRunReportMessage(`❌ Original file '${originalName}' not found.`);
      return;
    }
    setRunReportLoading(true);
    setRunReportMessage('');
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const res = await fetch(`${BASE_URL}/api/upload-to-forecast-tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalKey: originalFile.key,
          forecastKey: selectedResultFile
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Unknown error');
      navigate('/ReportsAnalytics');
    } catch (err) {
      setRunReportMessage(`❌ Error: ${err.message}`);
    } finally {
      setRunReportLoading(false);
    }
  };

  const handleClearForecastTable = async () => {
    if (!window.confirm('Are you sure you want to clear the forecast table? This cannot be undone.')) return;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    await fetch(`${apiBaseUrl}/api/clear-forecast-tables`, { method: 'POST' });
    alert('Forecast table cleared.');
  };

  // Fetch forecast report data for dropdown
  useEffect(() => {
    if (location.pathname === '/ReportsAnalytics') {
      fetch(`${BASE_URL}/api/final-forecast-report`)
        .then(res => res.json())
        .then(setForecastReportData)
        .catch(() => setForecastReportData([]));
    }
  }, [location.pathname]);

  // Fetch monthly data for selected item when modal is open
  useEffect(() => {
    if (showGraphModal && selectedGraphItem) {
      Promise.all([
        fetch(`${BASE_URL}/api/final-forecast-report/monthly?item=${selectedGraphItem}&year=2025`).then(res => res.json()),
        fetch(`${BASE_URL}/api/final-forecast-report/monthly?item=${selectedGraphItem}&year=2026`).then(res => res.json()),
      ]).then(([monthly2025, monthly2026]) => {
        setGraphMonthlyData([...monthly2025, ...monthly2026]);
      });
    }
  }, [showGraphModal, selectedGraphItem]);

  // Fetch forecast result files
  const fetchForecastResultFiles = async () => {
    setLoadingResultFiles(true);
    try {
      const res = await fetch(`${BASE_URL}/api/list-forecast-results`);
      const data = await res.json();
      setForecastResultFiles(data);
    } catch (err) {
      setForecastResultFiles([]);
    } finally {
      setLoadingResultFiles(false);
    }
  };

  useEffect(() => {
    fetchForecastResultFiles();
  }, []);

  // Search filter for both tables
  const filteredOriginalFiles = useMemo(() => forecastFiles.filter(f => f.name.toLowerCase().includes(searchResultsTerm.toLowerCase())), [forecastFiles, searchResultsTerm]);
  const filteredResultFiles = useMemo(() => forecastResultFiles.filter(f => f.name.toLowerCase().includes(resultSearchTerm.toLowerCase())), [forecastResultFiles, resultSearchTerm]);

  const handlePreviewResult = async (key: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/preview-forecast-result?key=${encodeURIComponent(key)}`);
      const text = await res.text();
      const rows = text
        .trim()
        .split("\n")
        .slice(0, 6) // header + 5 rows
        .map(line => line.split(","));
      const headers = rows[0];
      const preview = rows.slice(1).map(row =>
        Object.fromEntries(row.map((cell, i) => [headers[i], cell]))
      );
      setPreviewData(preview);
      setShowPreviewModal(true);
    } catch (err) {
      alert('Failed to load preview data');
    }
  };

  const handleDeleteResult = async (key: string) => {
    if (!window.confirm('Delete this forecast result file?')) return;
    await fetch(`${BASE_URL}/api/delete-forecast-result?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
    fetchForecastResultFiles();
    window.location.reload();
  };

  // Add the handleDownloadResult function (replace Preview logic)
  const handleDownloadResult = async (key: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/download-csv?key=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error('Failed to download file');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = key.split('/').pop() || 'forecast_result.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed.');
    }
  };

  const handleDuplicateResult = async (key: string | null) => {
    if (!key) return;
    const currentName = key.split('/').pop();
    const newName = window.prompt('Enter a new name for the duplicated file:', currentName?.replace(/(\.csv)?$/, `_copy.csv`));
    if (!newName || !newName.endsWith('.csv')) {
      alert('Please provide a valid .csv file name.');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/duplicate-forecast-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceKey: key, newName }),
      });
      if (!res.ok) throw new Error('Failed to duplicate result file');
      fetchForecastResultFiles();
      navigate('/ManageDemandPlans');
    } catch (err) {
      alert('Error duplicating result file.');
    }
  };

  const runForecastFromModal = () => {
    let startDate, endDate;
    if (dateSelectionMode === 'duration') {
      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + forecastMonths - 1);
      startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
    } else {
      startDate = `${startYear}-${String(startMonth + 1).padStart(2, '0')}`;
      endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}`;
    }
    handleRunForecast(startDate, endDate);
    setShowForecastDateModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={navigateHome}
          >
            <BarChart3 className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-orange-500">Forecast AI</h1>
          </div>
          <button 
            className="p-2 hover:bg-gray-700 rounded-full"
            onClick={navigateHome}
          >
            <Home className="h-6 w-6" />
          </button>
        </div>
      </header>

      <NavigationTabs />

      <div className="container mx-auto py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/DemandPlanInputs" replace />} />
          <Route path="/DemandPlanInputs" element={<DemandPlanInputs />} />
          <Route path="/SupplyNetworkModel" element={<SupplyNetworkModel />} />
          <Route path="/ManageDemandPlans" element={<ManageDemandPlans handleDelete={handleDeleteFile} />} />
          <Route path="/ManageUsers" element={<ManageUsers />} />
          <Route path="/ReportsAnalytics" element={
            showReportPage ? (
              <ManageTablesReportPage onBack={() => setShowReportPage(false)} />
            ) : (
              <>
                <ReportsAnalytics
                  forecastTableData={forecastTableData}
                  onShowReport={() => setShowReportPage(true)}
                />
                {/* Manage Graphs Modal */}
                {showGraphModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full relative">
                      <button
                        onClick={() => setShowGraphModal(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-blue-700 text-2xl focus:outline-none"
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <h2 className="text-2xl font-bold mb-4 text-center text-orange-700">Booking Forecast by Year – Monthly Breakdown</h2>
                      <div className="mb-4 flex items-center gap-4">
                        <label className="font-medium text-orange-900">Select Item:</label>
                        <select
                          className="border border-orange-300 rounded px-3 py-1 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                          value={selectedGraphItem}
                          onChange={e => setSelectedGraphItem(e.target.value)}
                          style={{ minWidth: 180 }}
                        >
                          <option value="">Choose an item...</option>
                          {forecastReportData.map((row: any) => (
                            <option key={row.item} value={row.item}>{row.item}</option>
                          ))}
                        </select>
                      </div>
                      {selectedGraphItem && graphMonthlyData.length > 0 ? (
                        <>
                          <Line
                            data={{
                              labels: graphMonthlyData.map((m: any) => m.date),
                              datasets: [
                                {
                                  label: 'History 2Y Ago (2023)',
                                  data: graphMonthlyData.map((m: any) => m.history2Y),
                                  borderColor: '#60a5fa',
                                  backgroundColor: 'rgba(96,165,250,0.2)',
                                  tension: 0.3,
                                },
                                {
                                  label: 'History 1Y Ago (2024)',
                                  data: graphMonthlyData.map((m: any) => m.history1Y),
                                  borderColor: '#fbbf24',
                                  backgroundColor: 'rgba(251,191,36,0.2)',
                                  tension: 0.3,
                                },
                                {
                                  label: 'Forecast',
                                  data: graphMonthlyData.map((m: any) => m.forecast),
                                  borderColor: '#34d399',
                                  backgroundColor: 'rgba(52,211,153,0.2)',
                                  borderDash: [5, 5],
                                  tension: 0.3,
                                },
                                {
                                  label: 'Adjusted Forecast',
                                  data: graphMonthlyData.map((m: any) => m.adjustedForecast),
                                  borderColor: '#f472b6',
                                  backgroundColor: 'rgba(244,114,182,0.2)',
                                  borderDash: [2, 2],
                                  tension: 0.3,
                                },
                                {
                                  label: 'Approved Forecast',
                                  data: graphMonthlyData.map((m: any) => m.approvedForecast),
                                  borderColor: '#6366f1',
                                  backgroundColor: 'rgba(99,102,241,0.2)',
                                  tension: 0.3,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              plugins: {
                                legend: { position: 'top' },
                                title: { display: false },
                                tooltip: { mode: 'index', intersect: false },
                              },
                              interaction: { mode: 'nearest', axis: 'x', intersect: false },
                              scales: {
                                x: { title: { display: true, text: 'Month' } },
                                y: { title: { display: true, text: 'Value' } },
                              },
                            }}
                          />
                          {/* MAPE and Accuracy metrics below the chart */}
                          {(() => {
                            // Group data by year
                            const yearly: Record<string, { actual: number; forecast: number }> = {};
                            graphMonthlyData.forEach((m: any) => {
                              const year = m.date.slice(0, 4);
                              if (!yearly[year]) yearly[year] = { actual: 0, forecast: 0 };
                              yearly[year].actual += m.history1Y;
                              yearly[year].forecast += m.forecast;
                            });
                            const years = Object.keys(yearly);
                            let mape = null;
                            let accuracy = null;
                            if (years.length > 0) {
                              // MAPE (mean of yearly)
                              const mapeArr = years.map(year => {
                                const { actual, forecast } = yearly[year];
                                if (actual === 0) return null;
                                return Math.abs((actual - forecast) / actual);
                              }).filter(x => x !== null);
                              if (mapeArr.length > 0) mape = (mapeArr.reduce((a, b) => a + (b as number), 0) / mapeArr.length) * 100;
                              // New Accuracy (mean of yearly)
                              const accArr = years.map(year => {
                                const { actual, forecast } = yearly[year];
                                if (actual === 0 && forecast === 0) return 1;
                                if (actual === 0 || forecast === 0) return 0;
                                const acc1 = 1 - Math.abs(actual - forecast) / Math.abs(forecast);
                                const acc2 = 1 - Math.abs(forecast - actual) / Math.abs(actual);
                                return Math.max(acc1, acc2);
                              });
                              if (accArr.length > 0) accuracy = (accArr.reduce((a, b) => a + b, 0) / accArr.length) * 100;
                            }
                            return (
                              <div className="flex flex-col items-center mt-6">
                                <div className="flex gap-8 text-lg font-semibold">
                                  <span className="text-orange-700">MAPE (Yearly): {mape !== null ? mape.toFixed(2) + '%' : 'N/A'}</span>
                                  <span className="text-orange-700">Accuracy (Yearly): {accuracy !== null ? accuracy.toFixed(2) + '%' : 'N/A'}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="text-center text-gray-500 py-8">Select an item to view its monthly breakdown graph.</div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )
          } />
          <Route path="/NewForecast" element={<NewForecastForm />} />
          <Route path="*" element={<Navigate to="/DemandPlanInputs" replace />} />
        </Routes>
      </div>

      <Modal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        title="Calendar Values"
      >
        <Calendars />
      </Modal>

      <Modal
        isOpen={showDemandClassesModal}
        onClose={() => setShowDemandClassesModal(false)}
        title="Demand Classes"
      >
        <DemandClasses />
      </Modal>

      <Modal
        isOpen={showItemColorsModal}
        onClose={() => setShowItemColorsModal(false)}
        title="Item Colors"
      >
        <ItemColors />
      </Modal>

      <Modal
        isOpen={showCustomerNamesModal}
        onClose={() => setShowCustomerNamesModal(false)}
        title="Customer Names"
      >
        <CustomerNames />
      </Modal>

      <Modal
        isOpen={showOrganizationsModal}
        onClose={() => setShowOrganizationsModal(false)}
        title="Organizations"
      >
        <Organizations />
      </Modal>

      <Modal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title="Users"
      >
        <UsersList />
      </Modal>
      <Modal
        isOpen={showUnitsModal}
        onClose={() => setShowUnitsModal(false)}
        title="Units of Measure"
      >
        <UnitsOfMeasure />
      </Modal>
      <Modal
        isOpen={showSubinventoriesModal}
        onClose={() => setShowSubinventoriesModal(false)}
        title="Item Subinventories"
      >
        <ItemSubinventories />
      </Modal>

      <Modal
        isOpen={showCollectedMeasureModal}
        onClose={() => setShowCollectedMeasureModal(false)}
        title="Collected Measure Data"
      >
        <CollectedMeasure />
      </Modal>

      <Modal
        isOpen={showForecastModal}
        onClose={() => setShowForecastModal(false)}
        title="New Forecast"
      >
        <NewForecastForm />
      </Modal>

      <Modal
        isOpen={forecastTableData.length > 0}
        onClose={() => setForecastTableData([])}
        title="Forecast Result Table"
      >
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm text-left border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">PRD_LVL_MEMBER_NAME</th>
                <th className="p-2 border">TIM_LVL_MEMBER_VALUE</th>
                <th className="p-2 border">ForecastAI</th>
              </tr>
            </thead>
            <tbody>
              {forecastTableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2 border">{row.PRD_LVL_MEMBER_NAME}</td>
                  <td className="p-2 border">{row.TIM_LVL_MEMBER_VALUE}</td>
                  <td className="p-2 border">{row.ForecastAI}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="File Preview (first 5 rows)"
        >
          {previewData ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(previewData[0]).map((header) => (
                      <th key={header} className="p-2 border">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="p-2 border">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No preview data available.</p>
          )}
        </Modal>

      {showForecastDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg space-y-6 relative">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-orange-500 text-2xl font-bold focus:outline-none"
              onClick={() => setShowForecastDateModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold">Select Forecast Date Range</h2>

            {/* Option Toggle */}
            <div className="flex gap-4 items-center">
              <label className="font-medium">Option:</label>
              <select
                className="p-2 border rounded"
                value={dateSelectionMode}
                onChange={(e) => setDateSelectionMode(e.target.value)}
              >
                <option value="duration">Plan Horizon (Days/Months)</option>
                <option value="range">Start and End Date</option>
              </select>
            </div>

            {/* Option 1: Duration */}
            {dateSelectionMode === 'duration' && (
              <div className="space-y-4">
                <label className="block font-medium">Forecast Horizon (in months):</label>
                <input
                  type="range"
                  min={1}
                  max={36}
                  value={forecastMonths}
                  onChange={(e) => {
                    const months = Number(e.target.value);
                    setForecastMonths(months);
                    const start = new Date();
                    const end = new Date(start);
                    end.setMonth(end.getMonth() + months);
                    setStartYear(start.getFullYear());
                    setStartMonth(start.getMonth());
                    setEndYear(end.getFullYear());
                    setEndMonth(end.getMonth());
                  }}
                  className="w-full"
                />
                <div className="text-center font-medium">
                  {forecastMonths} months ({forecastMonths * 30} days approx.)
                </div>
              </div>
            )}

            {/* Option 2: Start and End Date */}
            {dateSelectionMode === 'range' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-sm font-medium">Start Year</label>
                    <input
                      type="number"
                      className="border p-2 rounded w-24"
                      value={startYear}
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 5}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Start Month</label>
                    <select
                      value={startMonth}
                      onChange={(e) => setStartMonth(Number(e.target.value))}
                      className="border p-2 rounded"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">End Year</label>
                    <input
                      type="number"
                      className="border p-2 rounded w-24"
                      value={endYear}
                      min={startYear}
                      max={startYear + 5}
                      onChange={(e) => setEndYear(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">End Month</label>
                    <select
                      value={endMonth}
                      onChange={(e) => setEndMonth(Number(e.target.value))}
                      className="border p-2 rounded"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="text-sm text-gray-700 mt-4">
              Forecast Start: {startYear}-{String(startMonth + 1).padStart(2, '0')} | End: {endYear}-{String(endMonth + 1).padStart(2, '0')}<br />
              Total Duration: ~{Math.round(((endYear - startYear) * 12 + (endMonth - startMonth + 1)))} months
            </div>

            <div className="mt-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-end items-center">
              <button
                className={`py-2 px-4 rounded-md flex items-center gap-2 font-semibold shadow-sm transition-all ${selectedForecastFile && !loading ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                onClick={runForecastFromModal}
                disabled={!selectedForecastFile || loading}
                title={selectedForecastFile ? 'Run forecast on selected file' : 'Select a file to run forecast'}
              >
                <Play className="w-4 h-4" />
                {loading ? 'Running Forecast...' : 'Run Forecast'}
              </button>
            </div>
            {runReportMessage && <p className="text-sm">{runReportMessage}</p>}
          </div>
        </div>
      )}

      {showViewResultModal && (
        <div
          className="fixed top-5 right-5 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded shadow-md cursor-pointer z-50"
          onClick={() => setShowViewResultModal(false)}
        >
          ✅ Forecast complete! View it in <strong>Reports & Analytics → Manage Tables</strong>.
        </div>
      )}

    </div>
  );
}

export default App;