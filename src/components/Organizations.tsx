import React from 'react';
import { Building2 } from 'lucide-react';

const Organizations: React.FC = () => {
  const organizations = [
    'BERLIX ONE',
    'ESMALTE SUMMA',
    'PINT PARA PISOS',
    'BERELIX SUPER SATIN'
  ];

  return (
    <div className="space-y-4">
      {organizations.map((org) => (
        <div key={org} className="group">
          <div className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                <Building2 className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">{org}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Organizations;
