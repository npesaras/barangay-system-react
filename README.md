# Barangay Management System

A full-stack web application for barangay management, featuring resident records, clearance requests, QR code workflows, and robust admin/user authentication. Built with a MongoDB/Express backend and a React frontend.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
  - [Backend](#backend-setup)
  - [Frontend](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Admin Workflow](#admin-workflow)
  - [User Workflow](#user-workflow)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Scripts](#scripts)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

- **Authentication**: JWT-based login for admins and users, with role-based access control.
- **Resident Management**: Add, edit, delete, and view resident records.
- **Clearance Requests**: Users can request barangay clearance; admins can approve/deny.
- **QR Code Workflow**: Auto-generates QR codes for approved clearances; admins can scan/upload QR codes to verify and process requests.
- **Document Generation**: Admins can generate and download PDF clearances.
- **File Uploads**: Profile images, barangay logos, and QR code images.
- **Analytics**: Dashboard with statistics and charts.
- **CSV Export**: Export resident data.
- **Responsive UI**: Modern, mobile-friendly React interface.
- **Comprehensive Error Handling**: User-friendly feedback and robust backend validation.

---

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Multer, QRCode, bcrypt
- **Frontend**: React, Axios, React Router, React Icons, Recharts, jsPDF, React Toastify, @zxing/browser (QR scanning)
- **Styling**: CSS Modules, Tailwind CSS (if enabled)
- **Testing**: Jest, Supertest

---

## Project Structure

```
barangay-system/
  mongodb-backend/
    src/
      controllers/
      models/
      routes/
      middleware/
      config/
      uploads/
    package.json
    .env
  mongodb-frontend/
    src/
      components/
      services/
      styles/
      utils/
    package.json
    .env
  README.md
```

---

## Setup & Installation

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd mongodb-backend
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` and set:
     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/barangay-system
     JWT_SECRET=your-secret-key
     ADMIN_REGISTRATION_CODE=your-admin-code
     ```

3. **Create uploads directories:**
   ```bash
   mkdir -p uploads/profiles uploads/qrcodes uploads/barangay-logos
   ```

4. **Start the backend:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd mongodb-frontend
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env` and set:
     ```
     VITE_API_URL=http://localhost:5000/api
     ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```
   - Access the app at [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

**Backend (`mongodb-backend/.env`):**
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_REGISTRATION_CODE`

**Frontend (`mongodb-frontend/.env`):**
- `VITE_API_URL`

---

## Usage

### Admin Workflow

1. **Login** as admin.
2. **View and approve/deny clearance requests.**
3. **Generate QR codes** for approved requests.
4. **Scan or upload QR codes** to verify clearances.
5. **Generate and download PDF documents** for clearances.
6. **Manage residents** (add, edit, delete).
7. **View analytics and export data.**

### User Workflow

1. **Register/login** as a user.
2. **Request barangay clearance** via the form.
3. **Download QR code** after approval.
4. **Show QR code to barangay officials** for verification.

---

## API Endpoints

### Authentication
- `POST /auth/register-admin` — Register admin
- `POST /auth/login` — Login

### Residents
- `GET /residents` — List residents
- `POST /residents` — Add resident
- `PUT /residents/:id` — Update resident
- `DELETE /residents/:id` — Delete resident

### Clearance Requests
- `GET /clearance-requests` — List requests
- `POST /clearance-requests` — Create request
- `PATCH /clearance-requests/:id/approve` — Approve
- `PATCH /clearance-requests/:id/deny` — Deny
- `PATCH /clearance-requests/:id/generate-qr` — Generate QR code
- `GET /clearance-requests/:id/qr` — Get QR code image
- `POST /clearance-requests/scan` — Scan QR code

### Analytics & Export
- `GET /analytics/residents` — Resident stats
- `GET /residents/export/csv` — Export residents

---

## Database Models

### User
- `username` (unique)
- `password` (hashed)
- `role` ('admin' or 'user')
- `createdAt`

### Resident
- `firstName`, `middleName`, `lastName`
- `birthdate`, `gender`, `votersStatus`
- `profileImage`, etc.

### ClearanceRequest
- `fullname`, `address`, `purpose`, `message`
- `status` ('pending', 'approved', 'denied')
- `qrCodeHash`, `qrCodePath`
- `createdAt`

---

## Scripts

**Backend:**
- `npm run dev` — Start in development mode
- `npm start` — Start in production
- `npm test` — Run tests

**Frontend:**
- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run lint` — Lint code

---

## Security

- Passwords hashed with bcrypt
- JWT authentication for all protected routes
- Role-based access control (admin/user)
- Input validation and sanitization
- File upload validation

---

## Troubleshooting

- **API errors:** Ensure backend is running and API URL is correct.
- **Authentication issues:** Clear browser storage and re-login.
- **QR code not found:** Ensure QR code hash matches database.
- **Image upload issues:** Check file size/type and upload directory permissions.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request
