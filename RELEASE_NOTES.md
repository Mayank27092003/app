# Release Notes & Fixes

## Summary of Fixes
We have stabilized the backend application and Docker configuration to ensure a crash-free deployment.

### 1. Docker Stability (Puppeteer Support)
- **Issue**: The application was prone to crashing when generating PDFs or using Puppeteer due to missing system dependencies in the Docker image.
- **Fix**: Updated `Dockerfile` to use `node:20-slim` and explicitly installed all required chromium dependencies (`libnss3`, `libatk`, `libcups`, etc.).
- **Outcome**: PDF generation and other headless browser tasks now run smoothly without crashing the container.

### 2. Startup & Orchestration
- **Issue**: The backend service would often crash on startup because it attempted to connect to the database before the database was ready.
- **Fix**: Implemented a `healthcheck` in `docker-compose.yml` for the Postgres service and added a `depends_on: condition: service_healthy` rule for the backend.
- **Outcome**: The backend now waits intelligently for the database to be fully operational before starting, eliminating startup race conditions.

### 3. Automatic Recovery
- **Issue**: Services would stop permanently if an error occurred.
- **Fix**: Added `restart: always` policy to both backend and database containers.
- **Outcome**: The system self-heals by automatically restarting services if they encounter a transient error.

### 4. Database Connection
- **Fix**: Verified and consolidated connection strings to ensure consistent communication between the API and the database.

## Deployment Instructions

To start the application, simply run:

```bash
docker-compose up -d --build
```
This will:
1. Build the optimize backend image.
2. Start the database and wait for it to be ready.
3. Start the backend service.
