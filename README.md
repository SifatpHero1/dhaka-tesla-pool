# 🛺 Dhaka Tesla Pool MVP

A ride-sharing pool application for Dhaka city. Share a Tesla seat, split the fare, survive Dhaka traffic!

## 🚀 Features

- **Passenger Booking**: Passengers can book seats in shared Tesla rides
- **Driver Dashboard**: Driver (Jashim) can manage ride status (Arrived → Started → Completed)
- **Concurrency Handling**: Prevents overbooking when multiple passengers try to book the last seat simultaneously
- **Auto-initialization**: Automatically creates a new PoolRide when database is empty
- **Docker Support**: One-command deployment with Docker Compose

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Deployment**: Docker, Docker Compose

## 📦 Installation & Running

### Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development)

### Quick Start with Docker

```bash
# Clone the repository
git clone <your-repo-url>
cd dhaka-tesla-pool

# Start all services (Database + Backend + Frontend)
docker compose up --build

# Open browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```
