import React, { useEffect, useState } from 'react';
import { Warehouse, ChevronRight } from 'lucide-react';

interface SubfamilyData {
  subfamily: string;
}

const ItemSubinventories: React.FC = () => {
  const [subfamilies, setSubfamilies] = useState<SubfamilyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubfamily, setSelectedSubfamily] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubfamilies = async () => {
      try {
        const response = await fetch('/api/item-subfamilies');
        if (!response.ok) throw new Error('Failed to fetch subfamilies');
        const data = await response.json();
        setSubfamilies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subfamilies');
      } finally {
        setLoading(false);
      }
    };

    fetchSubfamilies();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-600 rounded">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {subfamilies.map((item) => (
        <div key={item.subfamily} className="group">
          <button
            onClick={() => setSelectedSubfamily(selectedSubfamily === item.subfamily ? null : item.subfamily)}
            className={`w-full flex justify-between items-center p-4 rounded-lg transition-all
              ${selectedSubfamily === item.subfamily ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                <span className="text-sm font-semibold text-orange-500">{item.subfamily.slice(0, 2)}</span>
              </div>
              <div>
                <p className="font-medium">{item.subfamily}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 transition-transform ${selectedSubfamily === item.subfamily ? 'rotate-90' : 'text-gray-400 group-hover:text-gray-600'}`} />
          </button>

          {selectedSubfamily === item.subfamily && (
            <div className="mt-2 p-4 bg-white rounded shadow border border-orange-100">
              <p className="text-sm text-gray-600">
                Selected Subfamily: <strong>{item.subfamily}</strong>
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ItemSubinventories;
