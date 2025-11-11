# Troubleshooting Guide - Test Runner Platform

This guide will help you resolve common frontend and backend issues.

## 🔍 Quick Diagnostic Tool

**First, access the diagnostic page:**
```
http://localhost:5173/diagnostic
```

This page will show you:
- Authentication status
- API connectivity
- Environment configuration
- Detailed error messages

## 📋 Step-by-Step Troubleshooting

### Step 1: Verify Backend is Running

1. **Check if backend is running on port 5000:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Expected output:**
   ```
   Server is running on port 5000
   Database connected successfully
   ```

3. **Test backend health endpoint:**
   ```bash
   curl http://localhost:5000/api/v1/health
   ```

   Should return: `{"status":"ok"}`

### Step 2: Verify Frontend is Running

1. **Check if frontend is running on port 5173:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Expected output:**
   ```
   VITE v7.x.x  ready in xxx ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

3. **Open browser:**
   ```
   http://localhost:5173
   ```

### Step 3: Check PostgreSQL Database

1. **Verify PostgreSQL is running:**
   ```bash
   sudo service postgresql status
   # OR
   pg_isready -h localhost -p 5432
   ```

2. **If not running, start it:**
   ```bash
   sudo service postgresql start
   ```

3. **Test database connection:**
   ```bash
   cd backend
   npm run db:test
   ```

### Step 4: Verify Environment Variables

#### Backend (.env)
Check `backend/.env`:
```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173  # ⚠️ Must match frontend URL!
API_VERSION=v1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_runner_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
```

#### Frontend (.env)
Check `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000  # ⚠️ Must match backend URL!
VITE_API_VERSION=v1
```

### Step 5: Common Issues and Fixes

#### Issue 1: Blank/White Screen
**Symptoms:** Nothing displays on the page

**Possible Causes:**
1. **JavaScript error in console** - Open browser DevTools (F12) and check Console tab
2. **API not reachable** - Backend not running or wrong URL
3. **Authentication issue** - Need to login first

**Solutions:**
```bash
# Check browser console for errors
# Then try:

# Clear browser cache and localStorage
localStorage.clear()
location.reload()

# Or visit diagnostic page:
http://localhost:5173/diagnostic
```

#### Issue 2: "Loading projects..." Forever
**Symptoms:** Page shows loading spinner indefinitely

**Solutions:**
1. **Check backend is running** on port 5000
2. **Check CORS settings** in backend .env
3. **Verify API calls** in browser Network tab (F12)
4. **Clear browser storage:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

#### Issue 3: Login Page Not Showing
**Symptoms:** Can't see login page

**Solutions:**
1. **Check URL is correct:**
   ```
   http://localhost:5173/login
   ```

2. **Check browser console** for errors

3. **Verify frontend build:**
   ```bash
   cd frontend
   npm run build
   npm run dev
   ```

#### Issue 4: 401 Unauthorized Errors
**Symptoms:** API calls return 401 errors

**Solutions:**
1. **Login again** - Token may have expired
2. **Check JWT_EXPIRES_IN** in backend .env
3. **Clear localStorage:**
   ```javascript
   localStorage.removeItem('auth_token')
   localStorage.removeItem('user')
   ```

#### Issue 5: CORS Errors
**Symptoms:** Console shows "CORS policy" errors

**Solutions:**
1. **Verify CORS_ORIGIN** in `backend/.env`:
   ```env
   CORS_ORIGIN=http://localhost:5173
   ```

2. **Restart backend** after changing .env:
   ```bash
   cd backend
   npm run dev
   ```

3. **Check if backend allows credentials** (should be in app.ts):
   ```typescript
   cors({
     origin: process.env.CORS_ORIGIN,
     credentials: true
   })
   ```

### Step 6: Database Issues

#### Issue: "Database connection failed"
**Solutions:**

1. **Start PostgreSQL:**
   ```bash
   sudo service postgresql start
   ```

2. **Create database if not exists:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE test_runner_db;
   \q
   ```

3. **Run migrations:**
   ```bash
   cd backend
   npm run db:migrate
   ```

4. **Seed initial data:**
   ```bash
   cd backend
   npm run db:seed
   ```

### Step 7: Port Conflicts

#### Issue: "Port already in use"

**For Backend (Port 5000):**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port in backend/.env:
PORT=5001
```

**For Frontend (Port 5173):**
```bash
# Find process using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>
```

## 🔧 Complete Reset Procedure

If nothing works, try this complete reset:

```bash
# 1. Stop all services
pkill -f node
pkill -f vite

# 2. Clear all caches
cd frontend
rm -rf node_modules dist
npm install
npm run build

cd ../backend
rm -rf node_modules dist
npm install
npm run build

# 3. Reset database
sudo -u postgres psql
DROP DATABASE IF EXISTS test_runner_db;
CREATE DATABASE test_runner_db;
\q

# 4. Run migrations and seed
cd backend
npm run db:migrate
npm run db:seed

# 5. Clear browser data
# In browser: F12 > Application > Clear storage > Clear site data

# 6. Start services
cd backend
npm run dev

# In another terminal:
cd frontend
npm run dev

# 7. Test
curl http://localhost:5000/api/v1/health
curl http://localhost:5173
```

## 📊 What Each Page Should Show

### Login Page (http://localhost:5173/login)
- Login/Register form
- "Test Runner" logo
- Email and password fields
- "Login" button

### Dashboard (http://localhost:5173/)
**With Projects:**
- Grid of project cards
- Each card shows: logo, name, metrics (tests passed/failed)
- Click card → Navigate to project detail

**Without Projects:**
- "No Projects Yet" message
- "Create Your First Project" button
- Empty state illustration

### Project Detail Page (http://localhost:5173/project/:id)
- Project name and logo
- Browser selector (Chromium/Firefox/WebKit)
- "Run All Tests" button
- Last run statistics
- Test files list (when available)

### Settings Page (http://localhost:5173/settings)
- Profile tab: User information, "Edit Profile" button
- Projects tab: List of projects
- Users tab: (Admin only) User management

## 🆘 Still Having Issues?

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for RED errors
4. Copy the error message

### Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for RED requests (failed API calls)
5. Click on failed request → Preview/Response tab

### Common Error Messages and Solutions

| Error Message | Solution |
|--------------|----------|
| "Network Error" | Backend not running on port 5000 |
| "CORS Error" | Check CORS_ORIGIN in backend/.env |
| "401 Unauthorized" | Login again, token expired |
| "404 Not Found" | Check route exists in App.tsx |
| "Cannot read property of undefined" | JavaScript error - check console for details |
| "Failed to fetch" | Backend not reachable - check URL and port |

## 📝 Useful Commands

```bash
# Check what's running on ports
lsof -i :5000    # Backend
lsof -i :5173    # Frontend
lsof -i :5432    # PostgreSQL

# View backend logs
cd backend
npm run dev | tee logs.txt

# View frontend logs
cd frontend
npm run dev | tee logs.txt

# Test API endpoints
curl http://localhost:5000/api/v1/health
curl http://localhost:5000/api/v1/projects -H "Authorization: Bearer YOUR_TOKEN"

# Check PostgreSQL
sudo -u postgres psql
\l              # List databases
\c test_runner_db   # Connect to database
\dt             # List tables
\q              # Quit
```

## 🎯 Expected File Structure

```
TEST-RUNNER-SOURCE-CODE/
├── backend/
│   ├── .env (must exist!)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── .env (must exist!)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── TROUBLESHOOTING.md (this file)
```

## 💡 Pro Tips

1. **Always check browser console first** - Most issues show errors there
2. **Use the diagnostic page** - http://localhost:5173/diagnostic
3. **Check both terminals** - Backend and frontend must both be running
4. **Verify .env files exist** - Both backend and frontend need them
5. **Use incognito/private mode** - Eliminates cache issues
6. **Check PostgreSQL is running** - Backend needs database
7. **Port conflicts** - Make sure 5000 and 5173 are free

---

**Created:** 2025-11-11
**Last Updated:** 2025-11-11
**Version:** 1.0.0
