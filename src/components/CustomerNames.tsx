import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface CustomerData {
  customerName: string;
}

const CustomerNames: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-4">
      {customers.length === 0 && (
        <div className="p-6 text-center text-orange-700 bg-orange-50 rounded-lg border border-orange-100 font-semibold">No customers found.</div>
      )}
      {customers.map((item) => (
        <div key={item.customerName} className="group">
          <div className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">{item.customerName}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerNames;
