import React, { useEffect, useState } from 'react';
import { Grid, ChevronRight } from 'lucide-react';

interface DemandClassData {
  customerClassCode: string;
  description?: string;
}

const DemandClasses: React.FC = () => {
  const [demandClasses, setDemandClasses] = useState<DemandClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemandClasses = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${BASE_URL}/api/demand-classes`);
        if (!response.ok) {
          throw new Error('Failed to fetch demand classes');
        }
        const data = await response.json();
        
        // Create a Map to store unique customer class codes
        const uniqueClasses = new Map();
        data.forEach((item: DemandClassData) => {
          if (!uniqueClasses.has(item.customerClassCode)) {
            uniqueClasses.set(item.customerClassCode, item);
          }
        });
        
        setDemandClasses(Array.from(uniqueClasses.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load demand classes');
        console.error('Error fetching demand classes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDemandClasses();
  }, []);

  const handleClassClick = (classCode: string) => {
    setSelectedClass(selectedClass === classCode ? null : classCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {demandClasses.map((item) => (
        <div
          key={item.customerClassCode}
          className="group"
        >
          <button
            onClick={() => handleClassClick(item.customerClassCode)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all
              ${selectedClass === item.customerClassCode 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-gray-50 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm">
                <span className="text-xl font-semibold text-orange-500">
                  {item.customerClassCode.slice(0, 2)}
                </span>
              </div>
              <div className="text-left">
                <p className="font-medium">Class Code: {item.customerClassCode}</p>
                {item.description && (
                  <p className="text-sm text-gray-600">{item.description}</p>
                )}
              </div>
            </div>
            <ChevronRight 
              className={`w-5 h-5 transition-transform ${
                selectedClass === item.customerClassCode ? 'rotate-90' : 'text-gray-400 group-hover:text-gray-600'
              }`}
            />
          </button>
          
          {selectedClass === item.customerClassCode && (
            <div className="mt-2 p-4 bg-white rounded-lg shadow-sm border border-orange-100">
              <p className="text-sm text-gray-600">
                Customer Class Code: <span className="font-medium">{item.customerClassCode}</span>
              </p>
              {item.description && (
                <p className="text-sm text-gray-600 mt-2">
                  Description: <span className="font-medium">{item.description}</span>
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DemandClasses;