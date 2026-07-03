export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  passwordHash?: string; // Hidden in API responses
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  description: string;
  isAvailable: boolean; // For table management
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tableId: string;
  tableNumber: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "17:00 - 19:00"
  guestsCount: number;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export const TIME_SLOTS = [
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00'
];
