# 🔧 CORS Error Fix - Quick Guide

## Problem
Your frontend (`http://localhost:5173`) cannot connect to your backend API (`https://4bd90b95a5d8.ngrok-free.app`) due to CORS policy restrictions.

## ✅ Solution Applied

### Backend Changes Made

**File: `backend/backend/settings.py`**

Added CORS configuration after `ROOT_URLCONF`:

```python
# CORS CONFIGURATION
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv()
)

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_HEADERS = [
    'accept', 'authorization', 'content-type', 
    'ngrok-skip-browser-warning', ...
]
```

## 📋 Steps to Fix

### Option 1: Using .env File (Recommended)

1. **Create `.env` file** in `backend/` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` file** and add your ngrok URL:
   ```env
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://4bd90b95a5d8.ngrok-free.app
   ```

3. **Restart Django server:**
   ```bash
   python manage.py runserver
   ```

### Option 2: Temporary Fix (Quick)

Update `backend/backend/settings.py` directly:

```python
# Find CORS_ALLOWED_ORIGINS and replace with:
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://4bd90b95a5d8.ngrok-free.app',  # Your ngrok URL
]
```

Then restart Django server.

### Option 3: Allow All Origins (Development Only - Not Secure!)

For quick testing only:

```python
# Add this to settings.py
CORS_ORIGIN_ALLOW_ALL = True  # ⚠️ ONLY FOR DEVELOPMENT!
```

## 🧪 Testing

After applying the fix:

1. **Restart your Django backend:**
   ```bash
   # Stop server (Ctrl+C)
   python manage.py runserver
   ```

2. **Refresh your frontend** (`http://localhost:5173`)

3. **Try logging in again**

4. **Check browser console** - CORS error should be gone!

## ✅ Verification

You should see these in your browser console:

✅ **Before fix:**
```
❌ Access to XMLHttpRequest blocked by CORS policy
```

✅ **After fix:**
```
🚀 API Request: POST https://4bd90b95a5d8.ngrok-free.app/api/auth/login/
✅ API Response: {status: 200, data: {...}}
```

## 🔄 When Ngrok URL Changes

Every time you restart ngrok, your URL changes (e.g., `4bd90b95a5d8` becomes something else).

**Update in 2 places:**

1. **Frontend:** `frontend/src/services/EndPoint.js`
   ```javascript
   export const BASE_URL = "https://YOUR_NEW_NGROK_URL.ngrok-free.app";
   ```

2. **Backend:** `backend/.env`
   ```env
   CORS_ALLOWED_ORIGINS=http://localhost:5173,https://YOUR_NEW_NGROK_URL.ngrok-free.app
   ```

3. **Restart both servers**

## 🎯 Production Setup

For production, restrict CORS to only your frontend domain:

```python
CORS_ALLOWED_ORIGINS = [
    'https://your-production-frontend.com',
]
```

## 🐛 Still Not Working?

### Check 1: Django CORS package installed?
```bash
pip list | grep django-cors-headers
```

If not found:
```bash
pip install django-cors-headers
```

### Check 2: Middleware order correct?
In `settings.py`, ensure `corsheaders.middleware.CorsMiddleware` is **first** in MIDDLEWARE:

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ← Must be first!
    'django.middleware.security.SecurityMiddleware',
    ...
]
```

### Check 3: Server restarted?
```bash
# Kill server completely
# Restart fresh
python manage.py runserver
```

### Check 4: Browser cache
Clear browser cache or use Incognito/Private mode

### Check 5: Ngrok configuration
Ensure ngrok is running:
```bash
ngrok http 8000
```

## 📝 Summary

**What was wrong:**
- Backend wasn't configured to accept requests from your frontend origin

**What was fixed:**
- Added CORS configuration in Django settings
- Allowed `http://localhost:5173` (frontend) to access backend API
- Included `ngrok-skip-browser-warning` header in allowed headers

**Next steps:**
1. Create `.env` file with your ngrok URL
2. Restart Django server
3. Test login again

---

**Need help?** Check the console for any new errors and share them.
