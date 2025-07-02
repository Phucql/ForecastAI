import React, { useEffect, useState } from 'react';
import { Users, ChevronRight } from 'lucide-react';

interface CustomerData {
  customerName: string;
}

const CustomerNames: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${BASE_URL}/api/customer-names`);
        if (!response.ok) throw new Error('Failed to fetch customer names');
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-orange-600 font-semibold">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 bg-orange-100 text-orange-700 rounded border border-orange-200 font-semibold">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-extrabold text-orange-900 mb-6 text-center tracking-tight drop-shadow-sm">Manage Demand Plans</h2>
      <div className="space-y-4">
        {customers.length === 0 && (
          <div className="p-6 text-center text-orange-700 bg-orange-50 rounded-lg border border-orange-100 font-semibold">No customers found.</div>
        )}
        {customers.map((item) => (
          <div key={item.customerName} className="group">
            <button
              onClick={() => setSelectedCustomer(selectedCustomer === item.customerName ? null : item.customerName)}
              className={`w-full flex justify-between items-center p-4 rounded-xl transition-all shadow-sm border border-orange-100
                ${selectedCustomer === item.customerName ? 'bg-orange-100 text-orange-900 ring-2 ring-orange-300' : 'bg-white hover:bg-orange-50 text-orange-900'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center bg-orange-50 rounded-full shadow border border-orange-200">
                  <span className="text-base font-bold text-orange-600">
                    {item.customerName.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-orange-900">{item.customerName}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 transition-transform ${selectedCustomer === item.customerName ? 'rotate-90 text-orange-600' : 'text-orange-300 group-hover:text-orange-500'}`} />
            </button>

            {selectedCustomer === item.customerName && (
              <div className="mt-2 p-4 bg-orange-50 rounded-xl shadow border border-orange-200">
                <p className="text-sm text-orange-800">
                  Selected Customer: <strong>{item.customerName}</strong>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerNames;
