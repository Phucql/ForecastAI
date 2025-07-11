import React, { useState } from 'react';

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
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
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <input className="w-full mb-2 p-2 border rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input className="w-full mb-4 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="w-full bg-orange-500 text-white py-2 rounded" type="submit">Login</button>
    </form>
  );
} 