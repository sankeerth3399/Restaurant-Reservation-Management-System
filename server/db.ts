import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Table, Reservation } from '../src/types'; // Extensionless import compatible with bundlers

const DB_DIR = process.env.VERCEL 
  ? '/tmp' 
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

interface Schema {
  users: User[];
  tables: Table[];
  reservations: Reservation[];
}

const DEFAULT_TABLES: Table[] = [
  { id: 't1', number: 1, capacity: 2, description: 'Romantic Corner Nook', isAvailable: true },
  { id: 't2', number: 2, capacity: 2, description: 'Quiet Window Bench', isAvailable: true },
  { id: 't3', number: 3, capacity: 4, description: 'Comfortable Leather Booth', isAvailable: true },
  { id: 't4', number: 4, capacity: 4, description: 'Patio Garden View Table', isAvailable: true },
  { id: 't5', number: 5, capacity: 6, description: 'Spacious Family Table', isAvailable: true },
  { id: 't6', number: 6, capacity: 8, description: 'Grand Banquet Table', isAvailable: true },
];

async function ensureDbDir() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (err) {
    // Ignore if already exists
  }
}

export async function readDb(): Promise<Schema> {
  await ensureDbDir();
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, seed and write default database
    const initialDb = await seedInitialDb();
    await writeDb(initialDb);
    return initialDb;
  }
}

export async function writeDb(data: Schema): Promise<void> {
  await ensureDbDir();
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function seedInitialDb(): Promise<Schema> {
  // Seed hash passwords
  const salt = await bcrypt.genSalt(10);
  const customerHash = await bcrypt.hash('customer123', salt);
  const adminHash = await bcrypt.hash('admin123', salt);

  const initialUsers: User[] = [
    {
      id: 'u1',
      email: 'customer@gmail.com',
      name: 'John Customer',
      role: 'customer',
      passwordHash: customerHash
    },
    {
      id: 'u2',
      email: 'admin@restaurant.com',
      name: 'Restaurant Admin',
      role: 'admin',
      passwordHash: adminHash
    }
  ];

  return {
    users: initialUsers,
    tables: DEFAULT_TABLES,
    reservations: []
  };
}
