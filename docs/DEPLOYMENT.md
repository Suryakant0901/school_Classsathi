# ClassSathi Deployment & Production Readiness Guide

This guide covers production deployment for **ClassSathi** on modern cloud hosting platforms like **Render**, **Railway**, **Vercel**, and **Docker**.

---

## 1. Environment Checklist

Ensure the following environment variables are set in your production environment:

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://admin:secret@cluster0.mongodb.net/classsathi` |
| `JWT_SECRET` | Strong secret for signing auth tokens | High-entropy 64-char hex string |
| `JWT_EXPIRES_IN` | Token lifespan | `7d` |
| `CORS_ORIGIN` | Deployed Frontend URL | `https://classsathi.vercel.app` |
| `SCHOOL_TIMEZONE` | School operational timezone | `Asia/Kolkata` |
| `LOW_ATTENDANCE_THRESHOLD` | Threshold for low-attendance warning | `75` |

---

## 2. Docker Deployment

A multi-stage `Dockerfile` and `docker-compose.yml` are provided in the repository root.

### Running with Docker Compose
```bash
# Build and start all services (Client, Server, MongoDB)
docker-compose up -d --build

# Seed initial database
docker-compose exec server npm run seed
```

---

## 3. Cloud Deployment: Render or Railway (Backend)
1. Link your GitHub repository to Render or Railway.
2. Configure Root Directory to `server/`.
3. Set Build Command: `npm install && npm run build`
4. Set Start Command: `npm run start`
5. Add the production environment variables listed above.
6. Run the seed script once to initialize the administrator account:
   ```bash
   npm run seed
   ```

---

## 4. Frontend Deployment: Vercel or Netlify
1. Link repository to Vercel.
2. Set Root Directory to `client/`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`
5. Output Directory: `dist`.
6. Configure API rewrite in `vercel.json` to proxy `/api/*` requests to your deployed backend.

---

## 5. First-Run Administrator Login
After deployment and database seeding, login with:
- **Email**: `admin@classsathi.com`
- **Password**: `Admin@123456`

*(Immediate action: Go to Profile and change the administrator password before production onboarding)*.
