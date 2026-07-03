import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { readDb, writeDb } from './server/db';
import { User, Table, Reservation, TIME_SLOTS } from './src/types';

// Setup environment variables
import dotenv from 'dotenv';
dotenv.config();

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'restaurant_reservation_jwt_secret_key_2026';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'admin';
  };
}

const app = express();
app.use(express.json());

  // Middleware: Authenticate Token
  const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authentication required. Please log in.' });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json({ message: 'Session expired or invalid token. Please log in again.' });
        return;
      }
      req.user = decoded as { id: string; email: string; name: string; role: 'customer' | 'admin' };
      next();
    });
  };

  // Middleware: Require Admin
  const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
      return;
    }
    next();
  };

  // --- API Routes ---

  // Diagnostics check for Vercel Serverless environment
  app.get('/api/diagnostics', async (req: Request, res: Response) => {
    try {
      const checks: any = {};
      checks.nodeVersion = process.version;
      checks.cwd = process.cwd();
      checks.env = {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
      };

      // Test DB Read
      try {
        const db = await readDb();
        checks.dbRead = 'success';
        checks.usersCount = db.users?.length;
        checks.tablesCount = db.tables?.length;
        checks.reservationsCount = db.reservations?.length;
      } catch (dbErr: any) {
        checks.dbRead = 'failed';
        checks.dbReadError = dbErr.message || dbErr;
        checks.dbReadStack = dbErr.stack || '';
      }

      // Test bcrypt
      try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('test', salt);
        const match = await bcrypt.compare('test', hash);
        checks.bcrypt = match ? 'success' : 'failed-match';
      } catch (bcryptErr: any) {
        checks.bcrypt = 'failed';
        checks.bcryptError = bcryptErr.message || bcryptErr;
        checks.bcryptStack = bcryptErr.stack || '';
      }

      res.json(checks);
    } catch (err: any) {
      res.status(500).json({ error: err.message || err, stack: err.stack || '' });
    }
  });

  // Auth: Register (Customers only)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: 'All fields (name, email, password) are required.' });
      return;
    }

    try {
      const db = await readDb();
      const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        res.status(400).json({ message: 'Email already registered. Please login or use a different email.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser: User = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        name,
        role: 'customer',
        passwordHash
      };

      db.users.push(newUser);
      await writeDb(db);

      // Issue JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(211).json({ // Correct custom code or 201 Created
        token,
        user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: `Registration error: ${error?.message || error}. Stack: ${error?.stack || ''}` 
      });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    try {
      const db = await readDb();
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user || !user.passwordHash) {
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: `Login error: ${error?.message || error}. Stack: ${error?.stack || ''}` 
      });
    }
  });

  // Auth: Me
  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // Tables: Get all tables
  app.get('/api/tables', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const db = await readDb();
      res.json(db.tables);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve tables.' });
    }
  });

  // Tables: Admin creates a table
  app.post('/api/tables', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { number, capacity, description } = req.body;

    if (!number || !capacity) {
      res.status(400).json({ message: 'Table number and capacity are required.' });
      return;
    }

    try {
      const db = await readDb();
      const num = parseInt(number);
      const cap = parseInt(capacity);

      if (db.tables.some(t => t.number === num)) {
        res.status(400).json({ message: `Table number ${num} already exists.` });
        return;
      }

      const newTable: Table = {
        id: 't_' + Math.random().toString(36).substr(2, 9),
        number: num,
        capacity: cap,
        description: description || `Table for ${cap}`,
        isAvailable: true
      };

      db.tables.push(newTable);
      // Sort tables by number for a better UI experience
      db.tables.sort((a, b) => a.number - b.number);
      await writeDb(db);

      res.status(201).json(newTable);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add table.' });
    }
  });

  // Tables: Admin updates a table
  app.put('/api/tables/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { number, capacity, description, isAvailable } = req.body;

    try {
      const db = await readDb();
      const tableIndex = db.tables.findIndex(t => t.id === id);

      if (tableIndex === -1) {
        res.status(404).json({ message: 'Table not found.' });
        return;
      }

      const num = parseInt(number);
      const cap = parseInt(capacity);

      // Check if number conflicts with another table
      if (db.tables.some(t => t.id !== id && t.number === num)) {
        res.status(400).json({ message: `Another table already uses number ${num}.` });
        return;
      }

      db.tables[tableIndex] = {
        ...db.tables[tableIndex],
        number: isNaN(num) ? db.tables[tableIndex].number : num,
        capacity: isNaN(cap) ? db.tables[tableIndex].capacity : cap,
        description: description !== undefined ? description : db.tables[tableIndex].description,
        isAvailable: isAvailable !== undefined ? !!isAvailable : db.tables[tableIndex].isAvailable
      };

      db.tables.sort((a, b) => a.number - b.number);
      await writeDb(db);

      res.json(db.tables[tableIndex]);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update table.' });
    }
  });

  // Tables: Admin deletes a table
  app.delete('/api/tables/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const db = await readDb();
      const tableIndex = db.tables.findIndex(t => t.id === id);

      if (tableIndex === -1) {
        res.status(404).json({ message: 'Table not found.' });
        return;
      }

      // Check if there are active (confirmed) future reservations on this table
      const hasActiveReservations = db.reservations.some(
        r => r.tableId === id && r.status === 'confirmed'
      );

      if (hasActiveReservations) {
        res.status(400).json({
          message: 'Cannot delete table. There are active reservations assigned to this table. Please cancel or reassign them first.'
        });
        return;
      }

      db.tables.splice(tableIndex, 1);
      await writeDb(db);

      res.json({ message: 'Table deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete table.' });
    }
  });

  // Reservations: Get list
  app.get('/api/reservations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { date } = req.query;

    try {
      const db = await readDb();
      let list = db.reservations;

      // Filter by ownership if customer
      if (req.user!.role !== 'admin') {
        list = list.filter(r => r.userId === req.user!.id);
      }

      // Optional filter by date
      if (date && typeof date === 'string') {
        list = list.filter(r => r.date === date);
      }

      // Sort by date then slot then table
      list.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.timeSlot.localeCompare(b.timeSlot);
      });

      res.json(list);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve reservations.' });
    }
  });

  // Reservations: Create reservation
  app.post('/api/reservations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { tableId, date, timeSlot, guestsCount } = req.body;

    if (!tableId || !date || !timeSlot || !guestsCount) {
      res.status(400).json({ message: 'Table, Date, Time Slot, and Guest Count are required.' });
      return;
    }

    const guests = parseInt(guestsCount);
    if (isNaN(guests) || guests <= 0) {
      res.status(400).json({ message: 'Number of guests must be a positive integer.' });
      return;
    }

    // Validate date format is YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }

    // Validate timeslot is in list
    if (!TIME_SLOTS.includes(timeSlot)) {
      res.status(400).json({ message: 'Invalid time slot selected.' });
      return;
    }

    try {
      const db = await readDb();
      const table = db.tables.find(t => t.id === tableId);

      if (!table) {
        res.status(404).json({ message: 'The selected table does not exist.' });
        return;
      }

      if (!table.isAvailable) {
        res.status(400).json({ message: 'The selected table is currently out of service.' });
        return;
      }

      // 1. Capacity validation: Ensure table capacity meets number of guests
      if (table.capacity < guests) {
        res.status(400).json({
          message: `Table capacity mismatch. Selected Table #${table.number} holds maximum ${table.capacity} guests, but you requested ${guests} seats.`
        });
        return;
      }

      // 2. Overlap check: Prevent overlapping reservations for the same table
      const isOverlapping = db.reservations.some(
        r => r.tableId === tableId &&
             r.date === date &&
             r.timeSlot === timeSlot &&
             r.status === 'confirmed'
      );

      if (isOverlapping) {
        res.status(409).json({
          message: `Reservation Conflict. Table #${table.number} is already booked for ${timeSlot} on ${date}. Please select another table, date, or time.`
        });
        return;
      }

      const newReservation: Reservation = {
        id: 'r_' + Math.random().toString(36).substr(2, 9),
        userId: req.user!.id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        tableId: table.id,
        tableNumber: table.number,
        date,
        timeSlot,
        guestsCount: guests,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      db.reservations.push(newReservation);
      await writeDb(db);

      res.status(211).json(newReservation); // Using 201 or 211
    } catch (error) {
      console.error('Create reservation error:', error);
      res.status(500).json({ message: 'Failed to complete reservation process.' });
    }
  });

  // Reservations: Customer Cancels own reservation
  app.post('/api/reservations/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const db = await readDb();
      const reservation = db.reservations.find(r => r.id === id);

      if (!reservation) {
        res.status(404).json({ message: 'Reservation not found.' });
        return;
      }

      // Check ownership
      if (req.user!.role !== 'admin' && reservation.userId !== req.user!.id) {
        res.status(403).json({ message: 'Access denied. You can only cancel your own reservations.' });
        return;
      }

      reservation.status = 'cancelled';
      await writeDb(db);

      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: 'Failed to cancel reservation.' });
    }
  });

  // Reservations: Admin Updates / Reassigns any reservation
  app.put('/api/reservations/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { tableId, date, timeSlot, guestsCount, status } = req.body;

    try {
      const db = await readDb();
      const reservationIndex = db.reservations.findIndex(r => r.id === id);

      if (reservationIndex === -1) {
        res.status(404).json({ message: 'Reservation not found.' });
        return;
      }

      const currentRes = db.reservations[reservationIndex];
      const targetTableId = tableId || currentRes.tableId;
      const targetDate = date || currentRes.date;
      const targetTimeSlot = timeSlot || currentRes.timeSlot;
      const targetGuests = guestsCount !== undefined ? parseInt(guestsCount) : currentRes.guestsCount;
      const targetStatus = status || currentRes.status;

      // Find selected table
      const table = db.tables.find(t => t.id === targetTableId);
      if (!table) {
        res.status(404).json({ message: 'Selected table does not exist.' });
        return;
      }

      // 1. Capacity validation
      if (table.capacity < targetGuests) {
        res.status(400).json({
          message: `Table capacity mismatch. Table #${table.number} has max capacity ${table.capacity}, but requested guests count is ${targetGuests}.`
        });
        return;
      }

      // 2. Overlap check: Prevent overlapping reservations for the same table (excluding this reservation itself)
      if (targetStatus === 'confirmed') {
        const isOverlapping = db.reservations.some(
          r => r.id !== id &&
               r.tableId === targetTableId &&
               r.date === targetDate &&
               r.timeSlot === targetTimeSlot &&
               r.status === 'confirmed'
        );

        if (isOverlapping) {
          res.status(409).json({
            message: `Reservation Conflict. Table #${table.number} is already booked for ${targetTimeSlot} on ${targetDate}.`
          });
          return;
        }
      }

      db.reservations[reservationIndex] = {
        ...currentRes,
        tableId: table.id,
        tableNumber: table.number,
        date: targetDate,
        timeSlot: targetTimeSlot,
        guestsCount: targetGuests,
        status: targetStatus
      };

      await writeDb(db);
      res.json(db.reservations[reservationIndex]);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update reservation.' });
    }
  });

  // Reservations: Admin Deletes a reservation
  app.delete('/api/reservations/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const db = await readDb();
      const reservationIndex = db.reservations.findIndex(r => r.id === id);

      if (reservationIndex === -1) {
        res.status(404).json({ message: 'Reservation not found.' });
        return;
      }

      db.reservations.splice(reservationIndex, 1);
      await writeDb(db);

      res.json({ message: 'Reservation deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete reservation.' });
    }
  });

  // --- Vite & Frontend Middleware setup ---

  if (process.env.NODE_ENV !== "production") {
    (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    })();
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
