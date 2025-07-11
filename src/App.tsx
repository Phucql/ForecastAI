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
import ForecastReportTable from './components/ForecastReportTable';
import ManageTables from './components/ManageTable';
import { format } from 'date-fns';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { unparse } from "papaparse";
import MergeAndUploadButton from './components/MergeAndUploadButton';
import { Route, Routes, useNavigate } from 'react-router-dom';
import ManageTablesReportPage from './components/ManageTablesReportPage';
import { Card, CardContent } from './components/utils/card';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from './components/AuthProvider';
import LoginForm from './components/LoginForm';
import DemandPlanInputs from './components/DemandPlanInputs';
import SupplyNetworkModel from './components/SupplyNetworkModel';
import ManageUsers from './components/ManageUsers';
import ReportsAnalytics from './components/ReportsAnalytics';

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

function NavigationTabs({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (tab: Tab) => void }) {
  const tabs = [
    { id: 'demand-plan-inputs', label: 'Demand Plan Inputs', icon: Database },
    { id: 'supply-network-model', label: 'Supply Network Model', icon: Grid },
    { id: 'manage-demand-plans', label: 'Manage Demand Plans', icon: BarChart3 },
    { id: 'manage-users', label: 'Manage Users', icon: Users },
    { id: 'reports-analytics', label: 'Reports & Analytics', icon: LineChart },
  ] as const;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto">
        <div className="flex space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? (['reports-analytics', 'demand-plan-inputs', 'supply-network-model', 'manage-users'].includes(tab.id) ? 'text-orange-500' : 'border-b-2 border-orange-500 text-orange-500')
                    : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function App() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('demand-plan-inputs');

  // If not logged in, show login landing page
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white border border-orange-200">
          <h1 className="text-3xl font-bold text-orange-500 mb-6 text-center">Food Forecast AI</h1>
          <LoginForm onLogin={login} />
        </div>
      </div>
    );
  }

  // After login, show tab navigation and default to Demand Plan Inputs
  return (
    <div className="min-h-screen bg-orange-50">
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>
        {activeTab === 'demand-plan-inputs' && <DemandPlanInputs />}
        {activeTab === 'supply-network-model' && <SupplyNetworkModel />}
        {activeTab === 'manage-users' && <ManageUsers />}
        {activeTab === 'reports-analytics' && <ReportsAnalytics />}
        {/* Add more tab content as needed */}
      </main>
    </div>
  );
}

export default App;