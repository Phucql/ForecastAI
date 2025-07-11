import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const NewForecastForm: React.FC<{ setActiveTab: (tab: string) => void; onComplete?: () => void }> = ({ setActiveTab, onComplete }) => {
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('veispinoza@kl.gscl.com');
  const [description, setDescription] = useState('');

  const [planningUnit, setPlanningUnit] = useState('');
  const [businessUnit, setBusinessUnit] = useState('');
  const [family, setFamily] = useState('');
  const [subfamily, setSubfamily] = useState('');
  const [color, setColor] = useState('');
  const [product, setProduct] = useState('');
  const [demandClass, setDemandClass] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [planningUnits, setPlanningUnits] = useState<string[]>([]);
  const [businessUnits, setBusinessUnits] = useState<string[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [subfamilies, setSubfamilies] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [demandClasses, setDemandClasses] = useState<string[]>([]);
  const [customerNames, setCustomerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtered demand classes based on current filters
  const [filteredDemandClasses, setFilteredDemandClasses] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/planning-units`).then(res => res.json()).then(setPlanningUnits);
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/customer-names`)
      .then(res => res.json())
      .then(data => {
        const names = Array.isArray(data)
          ? data.map((d) => typeof d === 'object' ? d["Customer Name"] || d.name || JSON.stringify(d) : d)
          : [];
        setCustomerNames(names);
      })
      .catch(err => console.error('Failed to load customer names:', err));
  }, []);

  useEffect(() => {
    if (planningUnit) {
      fetch(`${BASE_URL}/api/business-units?planningUnit=${planningUnit}`).then(res => res.json()).then(setBusinessUnits);
    }
  }, [planningUnit]);

  useEffect(() => {
    if (businessUnit) {
      fetch(`${BASE_URL}/api/families?businessUnit=${businessUnit}`).then(res => res.json()).then(setFamilies);
      fetch(`${BASE_URL}/api/demand-classes?businessUnit=${businessUnit}`).then(res => res.json()).then(setDemandClasses);
    }
  }, [businessUnit]);

  useEffect(() => {
    if (family) {
      fetch(`${BASE_URL}/api/subfamilies?family=${family}`).then(res => res.json()).then(setSubfamilies);
    }
  }, [family]);

  useEffect(() => {
    if (subfamily) {
      fetch(`${BASE_URL}/api/colors?subfamily=${subfamily}`).then(res => res.json()).then(setColors);
    }
  }, [subfamily]);

  useEffect(() => {
    if (color) {
      fetch(`${BASE_URL}/api/products?color=${encodeURIComponent(color)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setProducts(data);
          } else {
            console.error('Invalid product data:', data);
            setProducts([]);
          }
        })
        .catch(err => {
          console.error('Error fetching products:', err);
          setProducts([]);
        });
    }
  }, [color]);

  useEffect(() => {
    // Fetch only demand classes with matching forecast data for the current filters
    const fetchFilteredDemandClasses = async () => {
      const params = new URLSearchParams();
      if (planningUnit) params.append('planningUnit', planningUnit);
      if (businessUnit) params.append('businessUnit', businessUnit);
      if (family) params.append('family', family);
      if (subfamily) params.append('subfamily', subfamily);
      if (color) params.append('color', color);
      if (product) params.append('product', product);
      const res = await fetch(`${BASE_URL}/api/available-demand-classes?${params.toString()}`);
      if (res.ok) {
        setFilteredDemandClasses(await res.json());
      } else {
        setFilteredDemandClasses([]);
      }
    };
    fetchFilteredDemandClasses();
  }, [planningUnit, businessUnit, family, subfamily, color, product]);

  const handleSave = async () => {
    if (!name || !planningUnit || !businessUnit || !family || !subfamily || !color || !demandClass) {
        alert('Please fill in all required fields');
        return;
      }
    setLoading(true);
    try {
      const filters: Record<string, string> = {
        planningUnit,
        businessUnit,
        family,
        subfamily,
        color,
        demandClass,
      };
      if (product) filters.product = product;
      if (customerName) filters.customerName = customerName;

  
      // Call the API to fetch forecast data
      const response = await fetch(`${BASE_URL}/api/forecast-export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
  
      if (!response.ok) throw new Error(await response.text());
  
      // Get the CSV data from the response
      const csv = await response.text();
  
      // If no data is returned, alert the user and exit
      if (!csv.trim()) {
        alert('No matching forecast data found.');
        setLoading(false);
        return;
      }
  
      // Upload the original file (always named `${name}.csv`)
      const blob = new Blob([csv], { type: 'text/csv' });
      const originalFile = new File([blob], `${name}.csv`, { type: 'text/csv' });
  
      const uploadResponse = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          formData.append('file', originalFile);
          formData.append('owner', owner);
          formData.append('description', description);
          return formData;
        })()
      });

      if (uploadResponse.ok) {
        alert('Forecast file saved and uploaded to S3!');
        if (onComplete) onComplete();
        setActiveTab('manage-demand-plans');
      } else {
        let msg = 'Error uploading forecast file';
        try {
          const data = await uploadResponse.json();
          if (data && data.error) msg = data.error;
        } catch {}
        alert(msg);
      }
  
      // // Parse CSV for condensed logic
      // const lines = csv.trim().split('\n');
      // const headers = lines[0].split(',').map(h => h.trim());
      // const normalizedHeaders = headers.map(h =>
      //   h.replace(/^"|"$/g, '').trim().toLowerCase()
      // );
  
      // const dateIndex = normalizedHeaders.findIndex(h => h === 'tim_lvl_member_value');
      // const valueIndex = normalizedHeaders.findIndex(h => h === 'value_number');
      // const customerIndex = normalizedHeaders.findIndex(h => h === 'customer name');
  
      // if (dateIndex === -1 || valueIndex === -1 || customerIndex === -1) {
      //   console.log('⚠️ Missing columns:', { dateIndex, valueIndex, customerIndex });
      //   throw new Error('Missing required columns in CSV');
      // }
      
      // const dataRows = lines.slice(1); // ✅ <-- THIS is the missing line
  
      // const condensedMap: Record<string, { total: number; names: Set<string> }> = {};
  
      // for (const line of dataRows) {
      //   const cols = line.split(',');
      //   const date = cols[dateIndex]?.replace(/^"|"$/g, '').trim();
      //   const value = parseFloat(cols[valueIndex]?.replace(/^"|"$/g, '').trim() || '0');
      //   const customer = cols[customerIndex]?.replace(/^"|"$/g, '').trim();
  
      //   if (!date || isNaN(value)) continue;
  
      //   if (!condensedMap[date]) {
      //     condensedMap[date] = { total: value, names: customer ? [customer] : [] };
      //   } else {
      //     condensedMap[date].total += value;
      //     if (customer) condensedMap[date].names.push(customer);
      //   }
      // }
  
      // const condensedRows = Object.entries(condensedMap).map(([date, { total, names }]) => [
      //   date,
      //   total.toFixed(2),
      //   Array.from(names).join('_')
      // ]);
  
      // const condensedCSV = [
      //   ['TIM_LVL_MEMBER_VALUE', 'VALUE_NUMBER', 'Customer Name'],
      //   ...condensedRows
      // ].map(row => row.join(',')).join('\n');
  
      // const condensedBlob = new Blob([condensedCSV], { type: 'text/csv' });
      // const condensedFile = new File([condensedBlob], `Forecast_${name}.csv`, { type: 'text/csv' });
  
      // const condensedUpload = await fetch('/api/upload', {
      //   method: 'POST',
      //   body: (() => {
      //     const formData = new FormData();
      //     formData.append('file', condensedFile);
      //     formData.append('owner', owner);
      //     formData.append('description', `Condensed version of ${name}`);
      //     return formData;
      //   })()
      // });
  
      // if (!condensedUpload.ok) throw new Error('Failed to upload condensed forecast file');
  
      // alert('Forecast file saved and uploaded to S3!');
      // setActiveTab('manage-demand-plans');
    } catch (error: any) {
      console.error('Save error:', error);
      alert('Error saving forecast: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  

  const renderDropdown = (label: string, value: string, onChange: (val: string) => void, options: string[]) => (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border p-2 rounded">
        <option value="">Select {label}</option>
        {options.map(opt => (
          <option key={opt || Math.random()} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold mb-4">New Forecast</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" placeholder="Forecast File Name" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Owner *</label>
          <input value={owner} onChange={e => setOwner(e.target.value)} className="w-full border p-2 rounded" placeholder="Owner Email" />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium block mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded" rows={3} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {renderDropdown('Planning Unit', planningUnit, setPlanningUnit, planningUnits)}
        {renderDropdown('Business Unit', businessUnit, setBusinessUnit, businessUnits)}
        {renderDropdown('Family', family, setFamily, families)}
        {renderDropdown('Subfamily', subfamily, setSubfamily, subfamilies)}
        {renderDropdown('Color', color, setColor, colors)}
        {renderDropdown('Product (Optional)', product, setProduct, products)}
        {renderDropdown('Demand Class', demandClass, setDemandClass, filteredDemandClasses)}
        {renderDropdown('Customer Name (Optional)', customerName, setCustomerName, customerNames)}
      </div>

      <div>
        <button
          onClick={handleSave}
          className={`bg-orange-500 text-white px-6 py-2 rounded flex items-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {loading ? 'Uploading...' : 'Save Forecast'}
        </button>
      </div>
    </div>
  );
};

export default NewForecastForm;
