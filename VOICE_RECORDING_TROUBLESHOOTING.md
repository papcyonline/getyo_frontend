# Voice Recording Troubleshooting Guide

## Issue: Network Connection Error

If you're getting a "Network Error" or "Connection Error" when trying to use voice recording in the ChatScreen, follow these steps:

## Checklist

### 1. Backend Server Running ✓
Check if your backend server is running:
```bash
cd C:\Users\papcy\Desktop\yofam\getyo_backend
npm run dev
```

You should see:
```
🚀 Yo! Personal Assistant API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on: http://0.0.0.0:3000
🌐 Local: http://localhost:3000
📱 Network: http://192.168.1.231:3000
```

### 2. Network Configuration

**Current Configuration:**
- API Base URL: `http://192.168.1.231:3000`
- Location: `getyo_frontend/src/config/environment.ts`

**Check Your Device's Network:**

**Option A: Testing on Physical Device (Recommended)**
1. Ensure your phone and computer are on the **same WiFi network**
2. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your active WiFi adapter

3. If your computer's IP is different from `192.168.1.231`, update the config:
   - Open: `getyo_frontend/src/config/environment.ts`
   - Change line 20: `API_BASE_URL: 'http://YOUR_COMPUTER_IP:3000'`
   - Example: `API_BASE_URL: 'http://192.168.1.105:3000'`

**Option B: Testing on Android Emulator**
1. Use `10.0.2.2` instead of `192.168.1.231`:
   ```typescript
   API_BASE_URL: 'http://10.0.2.2:3000'
   ```

**Option C: Testing on iOS Simulator**
1. Use `localhost`:
   ```typescript
   API_BASE_URL: 'http://localhost:3000'
   ```

### 3. Firewall Settings

Windows Firewall might block incoming connections. To allow Node.js:

1. Open **Windows Defender Firewall**
2. Click **Allow an app through firewall**
3. Find **Node.js** in the list
4. Ensure both **Private** and **Public** are checked
5. Click **OK**

If Node.js isn't in the list:
```bash
# Run as Administrator
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes
```

### 4. Test Backend Connectivity

From your mobile device's browser, try to access:
```
http://192.168.1.231:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-17T22:03:56.157Z",
  "uptime": 760.3008346,
  "database": {
    "status": "healthy",
    "connected": true
  }
}
```

If this doesn't work, your device cannot reach the backend server.

### 5. Authentication Token

Ensure you're logged in:
1. The app stores auth tokens in secure storage
2. If you see "Session expired" error, log out and log back in
3. Check console logs for "AUTH_EXPIRED" or "401" errors

### 6. Backend Endpoint Check

Verify the transcribe endpoint exists:
```bash
curl -X POST http://192.168.1.231:3000/api/conversations/transcribe ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -F "audio=@test.wav"
```

Expected: You should see a response (even if it's an auth error, that means the endpoint exists)

## Quick Fix Steps

### Step 1: Restart Backend
```bash
cd C:\Users\papcy\Desktop\yofam\getyo_backend
# Stop any running server (Ctrl+C)
npm run dev
```

### Step 2: Check IP Address
```bash
ipconfig
```
Note the IPv4 address of your WiFi adapter (e.g., 192.168.1.231)

### Step 3: Update Frontend Config (if IP changed)
Edit `getyo_frontend/src/config/environment.ts`:
```typescript
API_BASE_URL: 'http://YOUR_ACTUAL_IP:3000'
```

### Step 4: Rebuild Frontend App
```bash
cd C:\Users\papcy\Desktop\yofam\getyo_frontend
# Stop the app (Ctrl+C if running)
npm start --clear
```

### Step 5: Test Voice Recording
1. Open the app on your device
2. Navigate to Chat screen
3. Tap the microphone icon
4. Speak something
5. Tap stop
6. Check the app console logs for detailed diagnostics

## Understanding the Error Messages

### Connection Error
```
ERROR  Transcribe and respond failed: {"code": "CONNECTION_ERROR", ...}
```
**Meaning:** Frontend cannot reach backend
**Fix:** Check steps 1-4 above

### Network Error
```
ERROR  {"code": "NETWORK_ERROR", ...}
```
**Meaning:** No internet/network connection
**Fix:** Check your device's WiFi/network settings

### Auth Expired
```
ERROR  {"code": "AUTH_EXPIRED", ...}
```
**Meaning:** Login session expired
**Fix:** Log out and log back in

### Timeout Error
```
ERROR  {"code": "TIMEOUT", ...}
```
**Meaning:** Request took too long (>10 seconds)
**Fix:** Backend might be starting up (cold start). Wait and try again.

## Testing the Fix

After following the steps above:

1. **Test Backend Health:**
   ```bash
   curl http://192.168.1.231:3000/health
   ```

2. **Test from Mobile Browser:**
   Open browser on your phone and visit:
   ```
   http://192.168.1.231:3000/health
   ```

3. **Test Voice Recording:**
   - Open app
   - Go to Chat screen
   - Tap microphone
   - The app will now show detailed diagnostics in the console

4. **Check Console Logs:**
   Look for these messages:
   ```
   🎤 Recording stopped, audio URI: ...
   📡 API Base URL: http://192.168.1.231:3000
   📡 Connection test: ✅ Connected
   📤 Sending audio for transcription...
   ```

## Advanced Diagnostics

### Enable Debug Logging

The app automatically logs detailed connection info. Check your terminal/console for:
- 🎤 Recording events
- 📡 Connection tests
- 📤 API requests
- ❌ Error details
- 🔍 Connection diagnostics

### Backend Logs

Check backend terminal for incoming requests:
```
POST /api/conversations/transcribe 200
```

If you don't see this when testing, the request isn't reaching the backend.

### Network Diagnostics Commands

**Check if port 3000 is open:**
```bash
netstat -ano | findstr :3000
```
Expected: `LISTENING` status

**Check firewall rules:**
```bash
netsh advfirewall firewall show rule name=all | findstr Node
```

## Common Solutions

### Solution 1: Use Physical Device on Same WiFi
Most reliable way to test:
1. Connect phone to same WiFi as computer
2. Use computer's WiFi IP address in config
3. Ensure firewall allows connections

### Solution 2: Use Expo Tunnel (Alternative)
If same-network connection doesn't work:
```bash
cd getyo_frontend
npx expo start --tunnel
```
This creates a secure tunnel and works across different networks.

### Solution 3: Deploy Backend Online
For production or testing across networks:
1. Deploy backend to Render.com, Heroku, or similar
2. Update API_BASE_URL to production URL
3. Update CORS settings in backend

## Still Having Issues?

If you've followed all steps and still get errors:

1. **Check backend logs** - Look for actual error messages
2. **Try curl** - Test the endpoint directly from terminal
3. **Verify auth token** - Log out and back in
4. **Check environment variables** - Ensure .env file is correct
5. **Restart everything** - Backend, frontend, and device

## Contact Information

- Backend logs location: Backend terminal output
- Frontend logs location: React Native console/terminal
- Config file: `getyo_frontend/src/config/environment.ts`
- Routes file: `getyo_backend/src/routes/conversations.ts`
- Controller: `getyo_backend/src/controllers/conversationController.ts`
