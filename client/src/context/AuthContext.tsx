import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, getAuthToken } from '../services/api.js';

export interface HostUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: HostUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  quickHostLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<HostUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMe = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await apiRequest<{ user: HostUser }>('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: HostUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: HostUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(data.token);
    setUser(data.user);
  };

  const quickHostLogin = async () => {
    return login('admin@arena.edu', 'admin123');
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, quickHostLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
