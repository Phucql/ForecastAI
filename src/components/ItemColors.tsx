import React, { useEffect, useState } from 'react';
import { Package, ChevronRight } from 'lucide-react';

interface ColorData {
  color: string;
}

const ItemColors: React.FC = () => {
  const [colors, setColors] = useState<ColorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/item-colors');
        if (!response.ok) throw new Error('Failed to fetch colors');
        const data = await response.json();
        setColors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load colors');
      } finally {
        setLoading(false);
      }
    };

    fetchColors();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-600 rounded">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {colors.map((item) => (
        <div key={item.color} className="group">
          <button
            onClick={() => setSelectedColor(selectedColor === item.color ? null : item.color)}
            className={`w-full flex justify-between items-center p-4 rounded-lg transition-all
              ${selectedColor === item.color ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                <span className="text-sm font-semibold text-orange-500">{item.color.slice(0, 2)}</span>
              </div>
              <div>
                <p className="font-medium">{item.color}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 transition-transform ${selectedColor === item.color ? 'rotate-90' : 'text-gray-400 group-hover:text-gray-600'}`} />
          </button>

          {selectedColor === item.color && (
            <div className="mt-2 p-4 bg-white rounded shadow border border-orange-100">
              <p className="text-sm text-gray-600">Selected Color: <strong>{item.color}</strong></p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
export default ItemColors;
