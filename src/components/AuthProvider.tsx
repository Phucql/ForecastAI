import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  showDemoPopup: boolean;
  setShowDemoPopup: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [showDemoPopup, setShowDemoPopup] = useState(false);

  const fetchUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/me`, { 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
        // Clear invalid token
        localStorage.removeItem('authToken');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      // Clear invalid token
      localStorage.removeItem('authToken');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Demo credentials check
    if (email !== 'admin@klug.com' || password !== 'Klug2025') {
      return { success: false, error: 'For demo purposes, please use admin@klug.com / Klug2025' };
    }

    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          // Store token
          localStorage.setItem('authToken', data.token);
          setToken(data.token);
          setUser(data.user);
          return { success: true };
        } else {
          return { success: false, error: 'No token received' };
        }
      } else {
        const errorData = await res.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    // Show demo popup after signup
    setShowDemoPopup(true);
    return { success: true };
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${BASE_URL}/api/logout`, { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token and user
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, showDemoPopup, setShowDemoPopup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 