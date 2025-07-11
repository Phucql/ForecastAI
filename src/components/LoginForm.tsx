import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Welcome/Brand Panel */}
      <div className="hidden md:flex flex-col justify-center items-center w-full md:w-1/2 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-white p-12">
        <div className="max-w-md">
          <div className="text-5xl font-extrabold mb-6 drop-shadow-lg">🍊 FoodForecastAI!</div>
          <div className="text-lg font-semibold mb-4">Welcome to your smart food demand planning platform.</div>
          <div className="text-base opacity-90">Automate your food business forecasts, reduce waste, and boost productivity with AI-driven insights.</div>
        </div>
        <div className="mt-16 text-xs opacity-70">© {new Date().getFullYear()} FoodForecastAI. All rights reserved.</div>
      </div>
      {/* Right: Login Form */}
      <div className="flex flex-1 flex-col justify-center items-center bg-white p-8 min-h-screen">
        <form onSubmit={handleSubmit} className="w-full max-w-md p-8 rounded-2xl shadow-xl border border-orange-100 bg-white flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-orange-600 mb-2 text-left">Welcome Back!</h2>
          <div className="text-sm mb-4 text-gray-700">
            Don't have an account? <a href="#" className="text-orange-600 font-bold hover:underline">Create a new account now</a>, it's FREE! Takes less than a minute.
          </div>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Username or Email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-orange-900 placeholder-orange-400 shadow-sm"
                required
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
            </div>
            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-orange-900 placeholder-orange-400 shadow-sm"
                required
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
            </div>
          </div>
          {error && <div className="text-red-600 text-center font-semibold">{error}</div>}
          <button type="submit" className="w-full py-3 rounded-lg bg-orange-600 text-white font-bold text-lg shadow-lg hover:bg-orange-700 transition-all">Login Now</button>
          <button type="button" className="w-full py-3 rounded-lg border border-orange-300 text-orange-700 font-bold text-lg shadow-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 33.1 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.5-7.6 21-17.5.1-.7.1-1.3.1-2 0-1.3-.1-2.7-.3-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.5 17.1 19.4 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3 15.1 3 7.4 8.7 6.3 14.7z"/><path fill="#FBBC05" d="M24 45c6.1 0 11.3-2 15-5.4l-7-5.7C29.7 35.1 27 36 24 36c-6.1 0-11.3-4.1-13.1-9.6l-7 5.4C7.4 39.3 15.1 45 24 45z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.2 3.1-4.7 7.5-11.7 7.5-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2-.9 7.2-2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-6.6 0-12 5.4-12 12s5.4 12 12 12c2.7 0 5.2-.9 7.2-2.4l6.4 6.4C33.5 42.9 28.1 45 24 45z"/></g></svg>
            Login with Google
          </button>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Forgot password? <a href="#" className="text-orange-600 font-bold hover:underline">Click here</a></span>
          </div>
        </form>
      </div>
    </div>
  );
} 