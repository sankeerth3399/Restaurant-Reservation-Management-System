import { User, Table, Reservation } from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      errMsg = data.message || errMsg;
    } catch (e) {
      // Ignore if not json
    }
    throw new Error(errMsg);
  }
  return response.json() as Promise<T>;
}

export const api = {
  // Auth API
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<{ token: string; user: User }>(res);
    localStorage.setItem('token', data.token);
    return data;
  },

  async register(email: string, password: string, name: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await handleResponse<{ token: string; user: User }>(res);
    localStorage.setItem('token', data.token);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  logout(): void {
    localStorage.removeItem('token');
  },

  // Tables API
  async getTables(): Promise<Table[]> {
    const res = await fetch(`${API_BASE}/tables`, {
      headers: getHeaders(),
    });
    return handleResponse<Table[]>(res);
  },

  async createTable(table: Omit<Table, 'id' | 'isAvailable'>): Promise<Table> {
    const res = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(table),
    });
    return handleResponse<Table>(res);
  },

  async updateTable(id: string, table: Partial<Table>): Promise<Table> {
    const res = await fetch(`${API_BASE}/tables/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(table),
    });
    return handleResponse<Table>(res);
  },

  async deleteTable(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/tables/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Reservations API
  async getReservations(date?: string): Promise<Reservation[]> {
    const url = date ? `${API_BASE}/reservations?date=${date}` : `${API_BASE}/reservations`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse<Reservation[]>(res);
  },

  async createReservation(reservation: {
    tableId: string;
    date: string;
    timeSlot: string;
    guestsCount: number;
  }): Promise<Reservation> {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reservation),
    });
    return handleResponse<Reservation>(res);
  },

  async cancelReservation(id: string): Promise<Reservation> {
    const res = await fetch(`${API_BASE}/reservations/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<Reservation>(res);
  },

  async updateReservation(id: string, reservation: Partial<Reservation>): Promise<Reservation> {
    const res = await fetch(`${API_BASE}/reservations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(reservation),
    });
    return handleResponse<Reservation>(res);
  },

  async deleteReservation(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/reservations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },
};
