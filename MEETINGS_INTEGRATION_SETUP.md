# Meeting Integration Setup Guide

This guide explains how to configure and test the meeting integrations for Google Meet, Zoom, Microsoft Teams, and Webex.

## Overview

All four major meeting providers are now supported:
- ✅ **Google Meet** - OAuth2 (uses Google Calendar API)
- ✅ **Zoom** - OAuth2 (Zoom Marketplace)
- ✅ **Microsoft Teams** - OAuth2 (Microsoft Graph API)
- ✅ **Webex** - OAuth2 (Webex Developer)

## Backend Endpoints

### Google Meet Endpoints
- `POST /api/meetings/google-meet/connect` - Connect Google Meet account
- `POST /api/meetings/google-meet/create` - Create a Google Meet meeting

### Zoom Endpoints
- `POST /api/meetings/zoom/connect` - Connect Zoom account
- `POST /api/meetings/zoom/create` - Create a Zoom meeting

### Microsoft Teams Endpoints
- `POST /api/meetings/teams/connect` - Connect Microsoft Teams account
- `POST /api/meetings/teams/create` - Create a Teams meeting

### Webex Endpoints
- `POST /api/meetings/webex/connect` - Connect Webex account
- `POST /api/meetings/webex/create` - Create a Webex meeting

### Shared Endpoints
- `GET /api/meetings/accounts` - Get all connected meeting accounts
- `DELETE /api/meetings/:provider/disconnect` - Disconnect meeting provider

## Configuration Required

### 1. Google Meet Setup (Google Cloud Console)

Google Meet uses the Google Calendar API to create meetings with Meet links.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Use the same project as Gmail integration (or create new)
3. Enable **Google Calendar API**
4. Use the same OAuth 2.0 credentials as Gmail
5. Ensure these scopes are included:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
6. Environment variables in backend `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_MEET_REDIRECT_URI=exp://localhost:8081
   ```
7. Frontend `.env` (same as Gmail):
   ```env
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

**Note**: Google Meet doesn't have a separate API. Meetings are created as Calendar events with `conferenceData` that generates a Meet link.

### 2. Zoom Setup (Zoom Marketplace)

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Click **Develop** → **Build App**
3. Choose **OAuth** app type
4. Fill in app details:
   - App name: Your app name
   - App type: User-managed app
   - Development: Yes (for testing)
5. Add OAuth **Redirect URL**: `exp://localhost:8081`
6. Add **Scopes**:
   - `meeting:write:admin` or `meeting:write`
   - `meeting:read:admin` or `meeting:read`
   - `user:read`
7. Get your credentials from the **App Credentials** page
8. Add environment variables to backend `.env`:
   ```env
   ZOOM_CLIENT_ID=your-zoom-client-id
   ZOOM_CLIENT_SECRET=your-zoom-client-secret
   ZOOM_REDIRECT_URI=exp://localhost:8081
   ```
9. Add to frontend `.env`:
   ```env
   EXPO_PUBLIC_ZOOM_CLIENT_ID=your-zoom-client-id
   ```

### 3. Microsoft Teams Setup (Azure Portal)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **App registrations** → **New registration**
3. Add redirect URI: `exp://localhost:8081`
4. In **API permissions**, add:
   - OnlineMeetings.ReadWrite
   - Calendars.ReadWrite
   - User.Read
5. Grant admin consent for your organization
6. Create a client secret under **Certificates & secrets**
7. Add environment variables to backend `.env`:
   ```env
   TEAMS_CLIENT_ID=your-teams-client-id
   TEAMS_CLIENT_SECRET=your-teams-client-secret
   TEAMS_REDIRECT_URI=exp://localhost:8081
   ```
8. Add to frontend `.env`:
   ```env
   EXPO_PUBLIC_TEAMS_CLIENT_ID=your-teams-client-id
   ```

**Note**: You can use the same Azure app registration as Outlook if you add the Teams-specific scopes.

### 4. Webex Setup (Webex Developer)

1. Go to [Webex for Developers](https://developer.webex.com/)
2. Sign in and navigate to **My Webex Apps**
3. Click **Create a New App** → **Integration**
4. Fill in details:
   - Integration name: Your app name
   - Icon: Upload your app icon
   - Redirect URI: `exp://localhost:8081`
5. Add **Scopes**:
   - `meeting:schedules_write`
   - `meeting:schedules_read`
   - `spark:people_read`
6. Save and get your Client ID and Client Secret
7. Add environment variables to backend `.env`:
   ```env
   WEBEX_CLIENT_ID=your-webex-client-id
   WEBEX_CLIENT_SECRET=your-webex-client-secret
   WEBEX_REDIRECT_URI=exp://localhost:8081
   ```
8. Add to frontend `.env`:
   ```env
   EXPO_PUBLIC_WEBEX_CLIENT_ID=your-webex-client-id
   ```

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
   - Scroll to the "Meetings" section

2. **Test Google Meet Connection**:
   - Tap "Connect" on Google Meet card
   - Should open Google OAuth flow
   - Sign in with Google account
   - Grant Calendar permissions
   - Should return to app with success message

3. **Test Zoom Connection**:
   - Tap "Connect" on Zoom card
   - Should open Zoom OAuth flow
   - Sign in with Zoom account
   - Authorize the app
   - Should return to app with success message

4. **Test Microsoft Teams Connection**:
   - Tap "Connect" on Microsoft Teams card
   - Should open Microsoft OAuth flow
   - Sign in with Microsoft account (work/school account recommended)
   - Grant permissions
   - Should return to app with success message

5. **Test Webex Connection**:
   - Tap "Connect" on Webex card
   - Should open Webex OAuth flow
   - Sign in with Webex account
   - Authorize the integration
   - Should return to app with success message

## Creating Meetings

After connecting a meeting provider, you can create meetings using the API:

### Google Meet Example
```typescript
const meeting = await meetingService.createMeeting('google-meet', {
  title: 'Team Standup',
  startTime: '2025-10-20T10:00:00Z',
  endTime: '2025-10-20T10:30:00Z',
  description: 'Daily team standup meeting',
  attendees: ['team@example.com'],
});
// Returns: { meetingId, meetingLink }
```

### Zoom Example
```typescript
const meeting = await meetingService.createMeeting('zoom', {
  title: 'Client Presentation',
  startTime: '2025-10-20T14:00:00Z',
  duration: 60, // minutes
  description: 'Q4 results presentation',
});
// Returns: { meetingId, meetingLink, password }
```

### Microsoft Teams Example
```typescript
const meeting = await meetingService.createMeeting('teams', {
  title: 'All Hands Meeting',
  startTime: '2025-10-20T15:00:00Z',
  endTime: '2025-10-20T16:00:00Z',
});
// Returns: { meetingId, meetingLink }
```

### Webex Example
```typescript
const meeting = await meetingService.createMeeting('webex', {
  title: 'Training Session',
  startTime: '2025-10-20T11:00:00Z',
  endTime: '2025-10-20T12:00:00Z',
  description: 'New employee onboarding',
});
// Returns: { meetingId, meetingLink, meetingNumber, password }
```

## Troubleshooting

### Common Issues

1. **OAuth Redirect Not Working**:
   - Ensure redirect URI matches exactly in provider console and `.env` files
   - For development, use `exp://localhost:8081`
   - For production, use your custom scheme

2. **"Invalid Client" Error**:
   - Double-check client ID and client secret in `.env` files
   - Ensure credentials match the provider console

3. **Permission Denied**:
   - Check that all required scopes are enabled in provider console
   - Some providers require admin consent for organization

4. **Meeting Creation Fails**:
   - Verify account is properly connected
   - Check token hasn't expired
   - Ensure meeting time is in the future

### Provider-Specific Issues

**Google Meet**:
- Error: "Calendar not found" → Ensure Google Calendar API is enabled
- Error: "Insufficient permissions" → Add Calendar scopes to OAuth consent screen

**Zoom**:
- Error: "Invalid grant" → Regenerate OAuth credentials
- Error: "User not found" → Ensure Zoom account is active

**Microsoft Teams**:
- Error: "Tenant-specific endpoint required" → User must sign in with work/school account
- Error: "Admin consent required" → Organization admin needs to grant consent

**Webex**:
- Error: "Invalid integration" → Verify Webex integration is activated
- Error: "Insufficient privileges" → Check scope permissions

### Backend Logs

Monitor backend console for detailed logs:
- `🔐 Exchanging OAuth code...` - OAuth flow started
- `✅ [Provider] connected successfully` - Connection successful
- `❌ Connection error` - Connection failed with error details

### Frontend Logs

Check React Native debugger for:
- `Opening OAuth flow for [provider]` - OAuth initiated
- `OAuth code received` - Code received from provider
- `Meeting provider connected successfully` - Account added to local storage

## Security Notes

1. **Never commit OAuth credentials** to version control
2. **Use HTTPS** for all OAuth redirects in production
3. **Implement token refresh** logic for expired access tokens
4. **Validate redirect URIs** to prevent OAuth hijacking
5. **Store tokens securely** in production environments

## API Rate Limits

Be aware of provider rate limits:

- **Google Meet**: 100 requests per 100 seconds per user
- **Zoom**:
  - Meeting creation: 100/day for free, 300/day for paid
  - API calls: Variable by endpoint
- **Microsoft Teams**: 10,000 requests per 10 minutes
- **Webex**: 100 requests per minute

## Next Steps

After configuration and testing:

1. **Implement UI for Meeting Creation**:
   - Create screen for scheduling meetings
   - Add meeting provider selection
   - Include attendee management

2. **Add Calendar Sync**:
   - Sync meetings to user's calendar
   - Send meeting invitations
   - Handle recurring meetings

3. **Meeting Management**:
   - List upcoming meetings
   - Join meeting directly from app
   - Cancel/reschedule meetings

4. **Production Deployment**:
   - Update redirect URIs to production URLs
   - Configure proper OAuth consent screens
   - Enable production OAuth scopes
   - Implement proper error handling

## Files Modified

### Backend
- `src/routes/meetings.ts` - All meeting endpoints and OAuth logic
- `src/index.ts` - Registered meetings route

### Frontend
- `src/services/meetingService.ts` - Meeting service with all providers
- `src/screens/IntegrationsScreen.tsx` - UI for connecting accounts
- `.env` - Environment variables for OAuth client IDs

## Support

For issues or questions:
1. Check backend logs at `C:\Users\papcy\Desktop\yofam\getyo_backend`
2. Check frontend logs in React Native debugger
3. Review provider documentation:
   - [Google Calendar API](https://developers.google.com/calendar/api)
   - [Zoom API](https://marketplace.zoom.us/docs/api-reference/)
   - [Microsoft Graph](https://docs.microsoft.com/en-us/graph/api/resources/onlinemeeting)
   - [Webex API](https://developer.webex.com/docs/api/v1/meetings)

## Important Notes

- Google Meet requires Google Calendar API enabled
- Zoom free accounts have daily meeting creation limits
- Microsoft Teams requires work/school account for full functionality
- Webex meetings can be created for both personal and enterprise accounts
