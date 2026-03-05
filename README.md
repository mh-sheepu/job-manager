# Job Manager Portal

A professional job management dashboard built with Next.js, Prisma, and PostgreSQL.

## Features

- **Dashboard**: Overview of leaves, absents, projects, and tasks
- **Leave Management**: Track and request different types of leaves (annual, sick, casual, unpaid)
- **Absent Tracking**: Record and manage absent days with reasons
- **Projects & Tasks**: Create projects with sub-sections and tasks
- **Authentication**: Secure login/signup with NextAuth.js

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Vercel Postgres)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Vercel

### 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or import this repo)
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Copy the connection strings

### 2. Set Environment Variables

In Vercel project settings, add these environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Vercel Postgres pooled connection string |
| `DIRECT_URL` | Vercel Postgres direct connection string |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |

### 3. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### 4. Run Database Migrations

After deployment, run migrations:
```bash
npx prisma db push
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/         # NextAuth routes
│   │   ├── dashboard/    # Dashboard API
│   │   ├── leaves/       # Leave management API
│   │   ├── absents/      # Absent tracking API
│   │   ├── projects/     # Projects API
│   │   ├── sections/     # Sections API
│   │   └── tasks/        # Tasks API
│   ├── dashboard/        # Dashboard page
│   ├── leaves/           # Leave management page
│   ├── absents/          # Absent tracking page
│   ├── works/            # Projects page
│   ├── login/            # Login page
│   └── register/         # Register page
├── components/           # Reusable components
├── lib/                  # Utilities (db, auth)
└── prisma/
    └── schema.prisma     # Database schema
```

## Database Schema

- **User**: Employee profiles with authentication
- **LeaveBalance**: Annual leave quotas per user
- **Leave**: Leave requests with dates, type, and status
- **Absent**: Absent day records with reasons
- **Project**: Work projects
- **Section**: Sub-sections within projects
- **Task**: Tasks within sections

## License

MIT
