import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

interface CalendarData {
  date: string;
  year: string;
  month: string;
  day: string;
}

const Calendars: React.FC = () => {
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const response = await fetch(`${BASE_URL}/api/calendar-data`);
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data');
        }
        const data = await response.json();
        
        // Create a Map to store unique year/month combinations
        const uniqueDates = new Map();
        data.forEach((item: CalendarData) => {
          const key = `${item.year}-${item.month}`;
          if (!uniqueDates.has(key)) {
            uniqueDates.set(key, item);
          }
        });
        
        setCalendarData(Array.from(uniqueDates.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calendar data');
        console.error('Error fetching calendar data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  const handleDateClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  const getMonthName = (month: string) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(month) - 1];
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
      {calendarData.map((item) => (
        <div
          key={item.date}
          className="group"
        >
          <button
            onClick={() => handleDateClick(item.date)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all
              ${selectedDate === item.date 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-gray-50 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg shadow-sm">
                <span className="text-xl font-semibold text-orange-500">{item.day}</span>
              </div>
              <div className="text-left">
                <p className="font-medium">{getMonthName(item.month)}</p>
                <p className="text-sm text-gray-600">{item.year}</p>
              </div>
            </div>
            <ChevronRight 
              className={`w-5 h-5 transition-transform ${
                selectedDate === item.date ? 'rotate-90' : 'text-gray-400 group-hover:text-gray-600'
              }`}
            />
          </button>
          
          {selectedDate === item.date && (
            <div className="mt-2 p-4 bg-white rounded-lg shadow-sm border border-orange-100">
              <p className="text-sm text-gray-600">
                Selected date: <span className="font-medium">{item.date}</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {getMonthName(item.month)} {item.day}, {item.year}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Calendars;