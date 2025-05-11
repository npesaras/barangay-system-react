# Barangay Management System - MongoDB Backend

This is the backend server for the Barangay Management System, using MongoDB as the database.

## Features

- User Authentication (JWT)
- Role-based Access Control (Admin/User)
- Resident Management
- Student Management
- Analytics and Statistics
- File Upload for Profile Images
- CSV Export

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/barangay-system
JWT_SECRET=your-secret-key
ADMIN_REGISTRATION_CODE=your-admin-code
```

3. Create the uploads directory:
```bash
mkdir -p uploads/profiles
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/auth/register-admin` - Register admin user
- POST `/auth/login` - User login

### Residents
- GET `/residents` - Get all residents
- GET `/residents/:id` - Get resident by ID
- POST `/residents` - Create new resident
- PUT `/residents/:id` - Update resident
- DELETE `/residents/:id` - Delete resident

### Students
- GET `/students` - Get all students
- GET `/students/:id` - Get student by ID
- POST `/students` - Create new student
- PUT `/students/:id` - Update student
- DELETE `/students/:id` - Delete student
- DELETE `/students/all` - Delete all students

### Analytics
- GET `/analytics/residents` - Get resident statistics
- GET `/analytics/student-stats` - Get student statistics

### Export
- GET `/residents/export/csv` - Export residents to CSV

## Database Schema

### User Model
- username (String, required, unique)
- password (String, required, hashed)
- role (String: 'admin' or 'user')
- createdAt (Date)

### Resident Model
- firstName (String, required)
- middleName (String)
- lastName (String, required)
- birthdate (Date)
- gender (String)
- votersStatus (String)
- profileImage (String)
- ... (other fields)

### Student Model
- firstName (String, required)
- lastName (String, required)
- studentId (String, required, unique)
- course (String)
- yearLevel (String)
- ... (other fields)

## Security Features

- Password hashing using bcrypt
- JWT authentication
- Role-based access control
- File upload validation
- Input validation and sanitization

## Error Handling

The API implements comprehensive error handling for:
- Invalid requests
- Authentication errors
- Database errors
- File upload errors
- Validation errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 