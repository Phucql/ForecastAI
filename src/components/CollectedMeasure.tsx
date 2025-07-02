import React, { useEffect, useState } from 'react';
import { Database, ChevronRight } from 'lucide-react';

interface FamilyData {
  family: string;
}

const CollectedMeasure: React.FC = () => {
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const response = await fetch('/api/collected-families');
        if (!response.ok) throw new Error('Failed to fetch families');
        const data = await response.json();
        setFamilies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load families');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilies();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-600 rounded">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {families.map((item) => (
        <div key={item.family} className="group">
          <button
            onClick={() => setSelectedFamily(selectedFamily === item.family ? null : item.family)}
            className={`w-full flex justify-between items-center p-4 rounded-lg transition-all
              ${selectedFamily === item.family ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                <span className="text-sm font-semibold text-orange-500">{item.family.slice(0, 2)}</span>
              </div>
              <div>
                <p className="font-medium">{item.family}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 transition-transform ${selectedFamily === item.family ? 'rotate-90' : 'text-gray-400 group-hover:text-gray-600'}`} />
          </button>

          {selectedFamily === item.family && (
            <div className="mt-2 p-4 bg-white rounded shadow border border-orange-100">
              <p className="text-sm text-gray-600">
                Selected Family: <strong>{item.family}</strong>
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CollectedMeasure;