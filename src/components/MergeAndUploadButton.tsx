import React, { useState } from 'react';

interface Props {
  selectedOriginal: string | null;
  selectedForecast: string | null;
  onComplete?: () => void; // ✅ New prop
}

const MergeAndUploadButton: React.FC<Props> = ({ selectedOriginal, selectedForecast, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUploadToTables = async () => {
    if (!selectedOriginal || !selectedForecast) {
      console.warn('[WARN] One or both files not selected');
      setMessage('❌ Please select both forecast and original files.');
      return;
    }

    setLoading(true);

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const res = await fetch(`${BASE_URL}/api/upload-to-forecast-tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalKey: selectedOriginal,
          forecastKey: selectedForecast
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Unknown error');

      // ✅ Trigger tab switch
      onComplete?.();
    } catch (err: any) {
      console.error('[ERROR]', err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleUploadToTables}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Uploading to Tables...' : 'Run Report'}
      </button>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
};

export default MergeAndUploadButton;
