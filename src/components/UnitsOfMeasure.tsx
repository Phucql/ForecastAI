import React from 'react';
import { Ruler } from 'lucide-react';

const UnitsOfMeasure: React.FC = () => {
  const units = ['Peso', 'USD'];

  return (
    <div className="space-y-4">
      {units.map((unit) => (
        <div key={unit} className="group">
          <div className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                <Ruler className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">{unit}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UnitsOfMeasure;
