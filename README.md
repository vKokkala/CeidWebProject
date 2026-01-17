# Thesis Assignment Project

A full-stack web application for managing thesis assignments, built with React (frontend) and Express/Node.js (backend), using PostgreSQL as the database.

## Project Structure

```
thesis-assignment-project/
├── frontend/          # React + Vite application
├── backend/           # Express.js API
│   ├── src/          # Source code
│   ├── db/           # Database initialization scripts
│   └── Dockerfile    # Backend Docker configuration
├── docker-compose.yml # Docker orchestration
└── README.md         # This file
```

## Prerequisites

- **Node.js** (v20 or higher)
- **npm** (v10 or higher)
- **Docker** and **Docker Compose**

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd thesis-assignment-project
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred values (optional)
```

### 3. Start the Backend with Docker

```bash
# Build and start all services (PostgreSQL, pgAdmin, Backend)
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d
```

This will start:
- **PostgreSQL** on `http://localhost:5432`
- **pgAdmin** (Database UI) on `http://localhost:5050`
- **Backend API** on `http://localhost:3000`

### 4. Start the Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Available Commands

### Docker Commands

```bash
# Start all services
docker-compose up

# Start services in background
docker-compose up -d

# Build and start (use after code changes)
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Restart a specific service
docker-compose restart backend

# Access backend container shell
docker exec -it thesis-backend sh

# Access PostgreSQL directly
docker exec -it thesis-postgres psql -U postgres -d thesis_db
```

### Frontend Commands

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Backend Commands (Local Development)

```bash
cd backend

# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build TypeScript
npx tsc

# Run production build
npm start
```

## Database Management

### Using pgAdmin

1. Open pgAdmin at `http://localhost:5050`
2. Login with credentials:
   - **Email**: `admin@admin.com`
   - **Password**: `admin`
3. Add a new server:
   - **Host**: `postgres`
   - **Port**: `5432`
   - **Database**: `thesis_db`
   - **Username**: `postgres`
   - **Password**: `postgres`

### Using Command Line

```bash
# Connect to PostgreSQL container
docker exec -it thesis-postgres psql -U postgres -d thesis_db

# Run SQL queries
\dt                    # List all tables
\d users              # Describe users table
SELECT * FROM users;  # Query users
\q                    # Quit
```

### Database Initialization

The database is automatically initialized with the schema defined in `backend/db/init.sql` when the PostgreSQL container is first created.

To reset the database:

```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh
docker-compose up
```

## Environment Variables

Create a `.env` file in the project root with these variables:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=thesis_db
DB_HOST=localhost
DB_PORT=5432

# pgAdmin Configuration
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin

# Backend Configuration
NODE_ENV=development
PORT=3000
```

## Troubleshooting

### Port Already in Use

If you get port conflicts:

```bash
# Check what's using the port
netstat -ano | findstr :3000   # Windows
lsof -i :3000                  # macOS/Linux

# Change ports in docker-compose.yml or kill the process
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Verify database health
docker exec -it thesis-postgres pg_isready -U postgres
```

### Backend Not Starting

```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend image
docker-compose up --build backend
```

### Frontend Build Errors

```bash
cd frontend

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Development Workflow

1. **Start Docker services** (database + backend):
   ```bash
   docker-compose up -d
   ```

2. **Start frontend** in development mode:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Make changes** to your code

4. **If you change backend code**, rebuild:
   ```bash
   docker-compose up --build backend
   ```

5. **View logs** to debug:
   ```bash
   docker-compose logs -f
   ```

## Production Build

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in frontend/dist/

# Backend is already containerized
docker-compose up --build
```

## API Endpoints

- `GET /` - Health check endpoint

Add more endpoints as you develop your API.

## Tech Stack

- **Frontend**: React 19, React Router, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL 16
- **Database UI**: pgAdmin 4
- **Containerization**: Docker, Docker Compose

## License

[Your License Here]

## Contributors

[Your Name/Team]
