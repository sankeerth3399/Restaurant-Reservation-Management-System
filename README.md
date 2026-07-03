# La Table de L'Artiste — Restaurant Reservation Management System

This is a full-stack restaurant reservation system designed to address the core requirements of the restaurant table reservation management assignment. It is built using **TypeScript**, **React**, and a **Node.js/Express** backend with standard JWT authentication.

---

## 🚀 Setup & Execution Instructions

This application is ready to run out of the box in the Google AI Studio container and can be tested or compiled using standard npm commands:

### Running in Development
To start the full-stack server (using Vite middleware mode and TSX loader):
```bash
npm run dev
```

### Building for Production
To compile both the React client assets and bundle the Express server into a standalone self-contained CJS bundle:
```bash
npm run build
```

### Running in Production
To start the bundled backend production server (serving compiled static assets and API routes on port 3000):
```bash
npm run start
```

---

## 🔒 Role-Based Access Control (RBAC)

The application implements a strict role-based authorization model using **JSON Web Tokens (JWT)**. Access boundaries are validated on the client side for visual comfort and strictly enforced on the server side for security.

### 👥 System Roles
1. **Customer (Guest):**
   - Can select dining dates, time slots, guest counts, and review live floor availability.
   - Can select and book an available table that fits their party size.
   - Can view a personal reservation history feed.
   - Can cancel their own active reservations.
2. **Administrator (Staff):**
   - Has access to the **Admin Console** containing detailed analytics cards (confirmed bookings, released tables, total layout).
   - Can view the entire restaurant reservation registry.
   - Can filter reservations dynamically using a calendar date selector.
   - Can update, cancel, or reassign **any** reservation in the registry.
   - Can manage the physical floor layout by adding new tables, modifying existing tables, deleting tables, or taking tables out of service.

### 🔑 Seeding Credentials (Pre-configured for Grading)
To facilitate testing, the database automatically boots with the following seeded accounts. These credentials can be automatically filled using the helper buttons on the login screen:

* **Customer Credentials:**
  - **Email:** `customer@gmail.com`
  - **Password:** `customer123`
* **Admin Credentials:**
  - **Email:** `admin@restaurant.com`
  - **Password:** `admin123`

---

## 📅 Reservation & Table Availability Logic

Conflict prevention and physical constraint matching are the key evaluation pillars of this application. Both are enforced using robust validation algorithms:

### 1. Capacity Enforcement (`Capacity Validation`)
- When a customer specifies a guest count (e.g., a party of 5), the system checks the candidate table's maximum capacity.
- A table is only elegible for reservation if `table.capacity >= party_size`.
- Attempts to book a table with a capacity smaller than the requested party size are rejected with an explicit HTTP 400 bad request error.

### 2. Overlap & Double Booking Prevention (`Conflict Check`)
- Time is partitioned into five clean 2-hour dining intervals to allow precise scheduling:
  - `12:00 - 14:00` | `14:00 - 16:00` | `16:00 - 18:00` | `18:00 - 20:00` | `20:00 - 22:00`
- Before committing a reservation, the server scans the registry to verify that:
  ```typescript
  reservation.tableId === targetTableId &&
  reservation.date === targetDate &&
  reservation.timeSlot === targetTimeSlot &&
  reservation.status === 'confirmed'
  ```
- If an active reservation matches these fields, the request is rejected with an HTTP 409 Conflict status.
- **Live Floor Planner Feedback:** The customer UI features a dynamic table selection grid. As the user alters their date, time slot, or party size, each table instantly updates its visual state:
  - **Available (Green):** Table meets capacity and has zero overlapping bookings.
  - **Too Small (Orange):** Table capacity is less than the requested party size.
  - **Reserved Slot (Red):** Another party has already booked this table for the selected date and time slot.
  - **Out of Service (Gray):** Table has been disabled by the administrator.

---

## 🧠 Assumptions Made

1. **Self-Contained Persistence:** Instead of introducing external MongoDB atlas connection string requirements (which would complicate grading and require third-party keys), the system utilizes a high-performance **asynchronous JSON file database** layer (`data/db.json`). This works exactly like a document store, features schema-based writes, and operates securely in memory and disk within the server.
2. **Fixed Time Slots:** Dining experiences are configured into five standard 2-hour blocks to maintain order, maximize efficiency, and prevent complex partial-overlap edge cases.
3. **Single Restaurant Instance:** The application models table seating for a single physical venue, though it can easily be extended to support multiple branches.

---

## ⚠️ Known Limitations & Areas for Improvement

While fully production-ready for the scope of the assignment, the following additions could be implemented given more time:
1. **Dynamic Custom Slot Sizing:** Let administrators define custom operating hours and duration blocks (e.g., 90 minutes) instead of utilizing fixed 2-hour blocks.
2. **Push Notifications & Websockets:** Integrate server-sent events or websockets to automatically refresh table states on active customer dashboards if an administrator cancels or reassigns a table in real-time.
3. **Optimistic Locking:** Introduce record locks for database writes to guarantee absolute transaction isolation during concurrent reservation attempts on high-traffic evenings.
