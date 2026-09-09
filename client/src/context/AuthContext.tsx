import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  logout: () => void;
}

const HOST_SESSION_TIMESTAMP_KEY = 'arena_host_last_active';
const HOST_CLOSED_TIMESTAMP_KEY = 'arena_host_closed_time';
const HOST_TAB_ACTIVE_KEY = 'arena_host_tab_active';
const GRACE_PERIOD_MS = 60 * 1000; // 60 seconds

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<HostUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const heartbeatIntervalRef = useRef<any>(null);

  const logout = () => {
    setAuthToken(null);
    sessionStorage.removeItem(HOST_TAB_ACTIVE_KEY);
    localStorage.removeItem(HOST_SESSION_TIMESTAMP_KEY);
    localStorage.removeItem(HOST_CLOSED_TIMESTAMP_KEY);
    setUser(null);
  };

  const fetchMe = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Check tab closure elapsed time
      const closedTimeStr = localStorage.getItem(HOST_CLOSED_TIMESTAMP_KEY);
      const isTabActive = sessionStorage.getItem(HOST_TAB_ACTIVE_KEY);
      const lastActiveStr = localStorage.getItem(HOST_SESSION_TIMESTAMP_KEY);
      const now = Date.now();

      if (closedTimeStr) {
        const closedElapsed = now - parseInt(closedTimeStr, 10);
        if (closedElapsed > GRACE_PERIOD_MS) {
          // Closed tab for more than 60 seconds -> Expire session!
          logout();
          setLoading(false);
          return;
        } else {
          // Reopened within 60 seconds -> Restore tab session
          localStorage.removeItem(HOST_CLOSED_TIMESTAMP_KEY);
          sessionStorage.setItem(HOST_TAB_ACTIVE_KEY, 'true');
        }
      } else if (!isTabActive && lastActiveStr) {
        const inactiveElapsed = now - parseInt(lastActiveStr, 10);
        if (inactiveElapsed > GRACE_PERIOD_MS) {
          logout();
          setLoading(false);
          return;
        }
      }

      const data = await apiRequest<{ user: HostUser }>('/api/auth/me');
      setUser(data.user);
      sessionStorage.setItem(HOST_TAB_ACTIVE_KEY, 'true');
      localStorage.setItem(HOST_SESSION_TIMESTAMP_KEY, Date.now().toString());
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  // Set up tab closure & 60s timeout event listeners
  useEffect(() => {
    if (!user) return;

    // Heartbeat to keep active timestamp fresh while tab is open
    const updateActiveTime = () => {
      localStorage.setItem(HOST_SESSION_TIMESTAMP_KEY, Date.now().toString());
    };
    updateActiveTime();
    heartbeatIntervalRef.current = setInterval(updateActiveTime, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem(HOST_CLOSED_TIMESTAMP_KEY, Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        const closedTimeStr = localStorage.getItem(HOST_CLOSED_TIMESTAMP_KEY);
        if (closedTimeStr) {
          const elapsed = Date.now() - parseInt(closedTimeStr, 10);
          if (elapsed > GRACE_PERIOD_MS) {
            logout();
          } else {
            localStorage.removeItem(HOST_CLOSED_TIMESTAMP_KEY);
            updateActiveTime();
          }
        }
      }
    };

    const handleBeforeUnload = () => {
      localStorage.setItem(HOST_CLOSED_TIMESTAMP_KEY, Date.now().toString());
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: HostUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    sessionStorage.setItem(HOST_TAB_ACTIVE_KEY, 'true');
    localStorage.setItem(HOST_SESSION_TIMESTAMP_KEY, Date.now().toString());
    localStorage.removeItem(HOST_CLOSED_TIMESTAMP_KEY);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: HostUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(data.token);
    sessionStorage.setItem(HOST_TAB_ACTIVE_KEY, 'true');
    localStorage.setItem(HOST_SESSION_TIMESTAMP_KEY, Date.now().toString());
    localStorage.removeItem(HOST_CLOSED_TIMESTAMP_KEY);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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

