import React, { useEffect, useState } from 'react';
import { Grid, ChevronRight } from 'lucide-react';

interface DemandClassData {
  customerClassCode: string;
  description?: string;
}

const DemandClasses: React.FC = () => {
  const [demandClasses, setDemandClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemandClasses = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${BASE_URL}/api/demand-classes`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setDemandClasses(data);
          setError(null);
        } else if (data && data.error) {
          setDemandClasses([]);
          setError(data.error);
        } else {
          setDemandClasses([]);
          setError('No demand classes found.');
        }
      } catch (err) {
        setDemandClasses([]);
        setError('Failed to load demand classes.');
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
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : Array.isArray(demandClasses) && demandClasses.length > 0 ? (
        demandClasses.slice(0, 10).map((dc) => (
          <div
            key={dc}
            className="group"
          >
            <button
              onClick={() => handleClassClick(dc)}
              className={`w-full flex items-center justify-between p-4 rounded-lg transition-all
                ${selectedClass === dc ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm">
                  <span className="text-xl font-semibold text-orange-500">
                    {dc.slice(0, 2)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-medium">Class Code: {dc}</p>
                </div>
              </div>
              <ChevronRight 
                className={`w-5 h-5 transition-transform ${
                  selectedClass === dc ? 'rotate-90' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
            </button>
            
            {selectedClass === dc && (
              <div className="mt-2 p-4 bg-white rounded-lg shadow-sm border border-orange-100">
                <p className="text-sm text-gray-600">
                  Customer Class Code: <span className="font-medium">{dc}</span>
                </p>
              </div>
            )}
          </div>
        ))
      ) : (
        <div>No demand classes found.</div>
      )}
    </div>
  );
};

export default DemandClasses;