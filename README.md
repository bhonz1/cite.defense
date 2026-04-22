# Capstone & Thesis Defense Appointment System

A full-stack appointment scheduling system for academic institutions, built with Next.js and Express.js.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, TypeScript
- **Backend**: Express.js REST API
- **Database**: Supabase PostgreSQL with pg (node-postgres)
- **Authentication**: NextAuth.js with JWT (role-based: Student / Admin / Adviser)
- **UI Theme**: Orange & white/light color palette — modern, elegant, professional

## Project Structure

```
CapstoneAppointment/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── auth/login/         # Login page
│   ├── student/            # Student portal
│   ├── admin/              # Admin dashboard
│   └── api/auth/           # NextAuth API routes
├── components/             # UI components (shadcn/ui)
├── db/                     # Database config & seed
│   ├── config.js           # PostgreSQL connection
│   ├── setup.js            # Create tables
│   └── seed.js             # Seed demo data
├── lib/                    # Utilities & API client
├── providers/              # React context providers
├── types/                  # TypeScript types
├── server.js               # Express API server
├── package.json            # Combined dependencies
└── .env.local              # Environment variables
```

## Features

### Landing Page
- Hero section with bold CTA
- Feature highlights
- How-it-works section
- School branding with orange gradient accents

### Student Portal
- Submit appointment form with all fields
- View appointment status
- Cancel pending appointments
- Group member management

### Admin Dashboard
- View all appointments in filterable/searchable table
- Approve, reject, or reschedule appointments
- Filter by: Academic Year, Research Type, Defense Type, Status
- Calendar view of scheduled defenses
- Statistics overview

### Core Features
- Role-based authentication (Student / Admin / Adviser)
- Appointment conflict detection (no double-booking)
- Real-time availability checking
- Toast notifications for actions
- Input validation (client + server side)

## Prerequisites

- Node.js 18+
- Supabase account (free tier works fine)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. **Create a Supabase project** at https://supabase.com
   - Sign up or log in to Supabase
   - Click "New Project"
   - Choose your organization, give it a name
   - Select a region close to you
   - Wait for the project to be created

2. **Get your database credentials**:
   - Go to Project Settings → Database
   - Copy the "Direct connection string" under "Connection string" section
   - Use this for `DATABASE_URL`

3. **Copy environment file and update credentials**:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
# Supabase Database URL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

4. **Create database tables**:

```bash
npm run db:setup
```

5. **Seed the database with demo data**:

```bash
npm run db:seed
```

### 3. Environment Variables

Update `.env.local` with your Supabase credentials and other config:

```env
# Supabase Database URLs (from your Supabase project settings)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret"

# Server
PORT=5000

# JWT
JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRES_IN="7d"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# API URL (for frontend to call backend)
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

### 4. Start Development Servers

You need to run both the Next.js frontend and Express backend:

```bash
# Terminal 1: Start the API server
npm run server:dev

# Terminal 2: Start the Next.js frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Demo Accounts

| Role    | Email                      | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@university.edu      | admin123    |
| Student | student@university.edu   | student123  |
| Adviser | adviser1@university.edu  | adviser123  |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Appointments
- `GET /api/appointments` - List appointments (with filters)
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get single appointment
- `PATCH /api/appointments/:id` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment

### Advisers
- `GET /api/advisers` - List all advisers

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/available-slots?date=YYYY-MM-DD` - Get available time slots

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run server` | Start Express API server (production) |
| `npm run server:dev` | Start Express API server with nodemon |
| `npm run build` | Build Next.js for production |
| `npm run start` | Start Next.js production server |
| `npm run db:setup` | Create database tables |
| `npm run db:seed` | Seed database with demo data |

## Data Model

### Appointment Fields
| Field          | Type      | Description                          |
|---------------|-----------|--------------------------------------|
| id            | String    | Auto-generated unique reference      |
| acadYear      | String    | e.g., "2024-2025"                   |
| researchType  | Enum      | CAPSTONE or THESIS                   |
| defenseType   | Enum      | PROPOSAL or FINAL                    |
| researchTitle | String    | Full title of the research           |
| student       | Relation  | Student who submitted                |
| adviser       | Relation  | Assigned faculty adviser             |
| members       | Array     | Group members                        |
| dateTime      | DateTime  | Scheduled defense date and time      |
| status        | Enum      | PENDING, APPROVED, REJECTED, COMPLETED|

## Production Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables for Production

Make sure to update all environment variables for production:
- Change `NEXTAUTH_SECRET` to a secure random string
- Change `JWT_SECRET` to a secure random string
- Update `NEXT_PUBLIC_API_URL` and `FRONTEND_URL` to production URLs
- Use a production PostgreSQL database

### Deploy

The project can be deployed to platforms like:
- **Vercel** (frontend) + **Railway/Render** (backend + database)
- **Full stack** on a VPS with Docker
- **Railway/Render** for the full stack

## License

MIT License - feel free to use for your academic institution.
