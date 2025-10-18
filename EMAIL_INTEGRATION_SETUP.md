# Email Integration Setup Guide

This guide explains how to configure and test the email integrations for Gmail, Outlook, Yahoo Mail, and iCloud Mail.

## Overview

All four major email providers are now supported:
- ✅ **Gmail** - OAuth2 (Google Cloud)
- ✅ **Outlook** - OAuth2 (Microsoft Azure)
- ✅ **Yahoo Mail** - OAuth2 (Yahoo Developer)
- ✅ **iCloud Mail** - App-Specific Password

## Backend Endpoints

### Gmail Endpoints
- `POST /api/email/gmail/connect` - Connect Gmail account
- `GET /api/email/gmail/messages` - Fetch Gmail messages
- `GET /api/email/gmail/messages/:messageId` - Get single message
- `POST /api/email/gmail/send` - Send Gmail message

### Outlook Endpoints
- `POST /api/email/outlook/connect` - Connect Outlook account
- `GET /api/email/outlook/messages` - Fetch Outlook messages
- `GET /api/email/outlook/messages/:messageId` - Get single message
- `POST /api/email/outlook/send` - Send Outlook message

### Yahoo Mail Endpoints
- `POST /api/email/yahoo/connect` - Connect Yahoo Mail account

### iCloud Mail Endpoints
- `POST /api/email/icloud/connect` - Connect iCloud Mail (uses app-specific password)

### Shared Endpoints
- `GET /api/email/accounts` - Get all connected accounts
- `DELETE /api/email/accounts/:accountId` - Disconnect account

## Configuration Required

### 1. Gmail Setup (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Gmail API**
4. Create OAuth 2.0 credentials:
   - Application type: iOS/Android
   - Add redirect URI: `exp://localhost:8081` (or your custom scheme)
5. Add environment variables to backend `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GMAIL_REDIRECT_URI=exp://localhost:8081
   ```
6. Add to frontend `.env`:
   ```env
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

### 2. Outlook Setup (Azure Portal)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **App registrations** → **New registration**
3. Add redirect URI: `exp://localhost:8081`
4. In **API permissions**, add:
   - Mail.Read
   - Mail.Send
   - Mail.ReadWrite
   - User.Read
5. Create a client secret under **Certificates & secrets**
6. Add environment variables to backend `.env`:
   ```env
   OUTLOOK_CLIENT_ID=your-outlook-client-id
   OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
   OUTLOOK_REDIRECT_URI=exp://localhost:8081
   ```
7. Add to frontend `.env`:
   ```env
   EXPO_PUBLIC_OUTLOOK_CLIENT_ID=your-outlook-client-id
   ```

### 3. Yahoo Mail Setup (Yahoo Developer)

1. Go to [Yahoo Developer Network](https://developer.yahoo.com/apps/)
2. Create a new app
3. Add redirect URI: `exp://localhost:8081`
4. Select **Mail** API
5. Add environment variables to backend `.env`:
   ```env
   YAHOO_CLIENT_ID=your-yahoo-client-id
   YAHOO_CLIENT_SECRET=your-yahoo-client-secret
   YAHOO_REDIRECT_URI=exp://localhost:8081
   ```
6. Add to frontend `.env`:
   ```env
   EXPO_PUBLIC_YAHOO_CLIENT_ID=your-yahoo-client-id
   ```

### 4. iCloud Mail Setup (No API Credentials Needed)

iCloud uses **App-Specific Passwords** instead of OAuth:

1. Users need to:
   - Go to [appleid.apple.com](https://appleid.apple.com)
   - Sign in and navigate to **Security**
   - Generate an **App-Specific Password**
2. In the app, users will be prompted to enter:
   - iCloud email address
   - App-specific password

**Server Configuration:**
- IMAP Server: `imap.mail.me.com` (Port 993)
- SMTP Server: `smtp.mail.me.com` (Port 587)

## Testing the Integrations

### 1. Start the Backend Server

```bash
cd C:\Users\papcy\Desktop\yofam\getyo_backend
npm run dev
```

Server should be running on `http://localhost:3000`

### 2. Start the Frontend App

```bash
cd C:\Users\papcy\Desktop\yofam\getyo_frontend
npm run dev
# or
npm run android
```

### 3. Test Each Provider

1. **Navigate to Integrations Screen**:
   - Sign in to the app
   - Go to Settings → Integrations

2. **Test Gmail Connection**:
   - Tap "Connect" on Gmail card
   - Should open Google OAuth flow
   - Sign in with Google account
   - Grant permissions
   - Should return to app with success message

3. **Test Outlook Connection**:
   - Tap "Connect" on Outlook card
   - Should open Microsoft OAuth flow
   - Sign in with Microsoft account
   - Grant permissions
   - Should return to app with success message

4. **Test Yahoo Mail Connection**:
   - Tap "Connect" on Yahoo Mail card
   - Should open Yahoo OAuth flow
   - Sign in with Yahoo account
   - Grant permissions
   - Should return to app with success message

5. **Test iCloud Mail Connection**:
   - Tap "Connect" on iCloud Mail card
   - Enter iCloud email in first prompt
   - Enter app-specific password in second prompt
   - Should connect successfully

## Troubleshooting

### Common Issues

1. **OAuth Redirect Not Working**:
   - Ensure redirect URI matches exactly in both provider console and `.env` files
   - For development, use `exp://localhost:8081`
   - For production, use your custom scheme

2. **"Invalid Client" Error**:
   - Double-check client ID and client secret in `.env` files
   - Ensure credentials match the provider console

3. **Permission Denied**:
   - Check that all required scopes are enabled in provider console
   - Re-authenticate to grant new permissions

4. **iCloud Connection Fails**:
   - Ensure user has enabled 2FA on iCloud account
   - Verify app-specific password is generated correctly
   - Check that user entered password without spaces

### Backend Logs

Monitor backend console for detailed logs:
- `🔐 Exchanging OAuth code...` - OAuth flow started
- `✅ Account connected successfully` - Connection successful
- `❌ Connection error` - Connection failed with error details

### Frontend Logs

Check React Native debugger for:
- `Opening OAuth flow for [provider]` - OAuth initiated
- `OAuth code received` - Code received from provider
- `Email account connected successfully` - Account added to local storage

## Security Notes

1. **Never commit OAuth credentials** to version control
2. **Encrypt app-specific passwords** before storing in database (production)
3. **Use HTTPS** for all OAuth redirects in production
4. **Implement token refresh** logic for expired access tokens
5. **Validate redirect URIs** to prevent OAuth hijacking

## Next Steps

After configuration and testing:

1. **Implement Email Viewing**:
   - Use `/api/email/[provider]/messages` endpoints
   - Display emails in EmailListScreen
   - Show email details in EmailDetailScreen

2. **Implement Email Sending**:
   - Use `/api/email/[provider]/send` endpoints
   - Create compose screen for new emails

3. **Add Token Refresh**:
   - Implement automatic token refresh when expired
   - Handle 401 errors gracefully

4. **Production Deployment**:
   - Update redirect URIs to production URLs
   - Configure proper OAuth consent screens
   - Enable production OAuth scopes

## Files Modified

### Backend
- `src/routes/email.ts` - All email endpoints and OAuth logic

### Frontend
- `src/services/emailService.ts` - Email service with all providers
- `src/screens/IntegrationsScreen.tsx` - UI for connecting accounts
- `src/types/email.ts` - TypeScript interfaces for email

## Support

For issues or questions:
1. Check backend logs at `C:\Users\papcy\Desktop\yofam\getyo_backend`
2. Check frontend logs in React Native debugger
3. Review provider documentation:
   - [Gmail API Docs](https://developers.google.com/gmail/api)
   - [Microsoft Graph Mail API](https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview)
   - [Yahoo Mail API](https://developer.yahoo.com/mail/)
   - [iCloud Mail Settings](https://support.apple.com/en-us/HT202304)
