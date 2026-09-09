const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export function getAuthToken(): string | null {
  return localStorage.getItem('arena_host_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('arena_host_token', token);
  } else {
    localStorage.removeItem('arena_host_token');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data;
}
