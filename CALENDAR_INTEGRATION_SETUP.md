# Calendar Integration Setup Guide

This guide explains how to configure and test the calendar integrations for Google Calendar, Outlook Calendar, and Apple Calendar.

## Overview

All three major calendar providers are now supported:
- ✅ **Google Calendar** - OAuth2 (uses Google Calendar API)
- ✅ **Outlook Calendar** - OAuth2 (uses Microsoft Graph API)
- ✅ **Apple Calendar** - Device-level permissions (uses EventKit)

## Backend Endpoints

### Google Calendar Endpoints
- `POST /api/integrations/google-calendar/connect` - Connect Google Calendar account
- `POST /api/integrations/google-calendar/disconnect` - Disconnect Google Calendar
- `GET /api/integrations/google-calendar/events` - Fetch calendar events
- `POST /api/integrations/google-calendar/create-event` - Create a new calendar event
- `PUT /api/integrations/google-calendar/update-event/:eventId` - Update an existing event
- `DELETE /api/integrations/google-calendar/delete-event/:eventId` - Delete an event

### Outlook Calendar Endpoints
- `POST /api/integrations/outlook-calendar/connect` - Connect Outlook Calendar account
- `POST /api/integrations/outlook-calendar/disconnect` - Disconnect Outlook Calendar
- `GET /api/integrations/outlook-calendar/events` - Fetch calendar events
- `POST /api/integrations/outlook-calendar/create-event` - Create a new calendar event
- `PATCH /api/integrations/outlook-calendar/update-event/:eventId` - Update an existing event
- `DELETE /api/integrations/outlook-calendar/delete-event/:eventId` - Delete an event

### Apple Calendar Endpoints
- `POST /api/integrations/apple-calendar/connect` - Connect Apple Calendar (device permissions)
- `POST /api/integrations/apple-calendar/disconnect` - Disconnect Apple Calendar
- `GET /api/integrations/apple-calendar/events` - Acknowledge device-side event management
- `POST /api/integrations/apple-calendar/create-event` - Acknowledge event created on device
- `PUT /api/integrations/apple-calendar/update-event/:eventId` - Acknowledge event updated on device
- `DELETE /api/integrations/apple-calendar/delete-event/:eventId` - Acknowledge event deleted on device

### Shared Endpoints
- `GET /api/integrations/status` - Get all integration statuses (including calendar)

## Configuration Required

### 1. Google Calendar Setup (Google Cloud Console)

Google Calendar uses the Google Calendar API for managing events.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Use the same project as Gmail integration (or create new)
3. Enable **Google Calendar API**
4. Use the same OAuth 2.0 credentials as Gmail
5. Ensure these scopes are included in OAuth consent screen:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
6. Add redirect URI: `exp://localhost:8081` (for development)
7. Environment variables in backend `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
8. Frontend `.env` (same as Gmail):
   ```env
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

**Note**: The same Google OAuth credentials work for both Gmail and Google Calendar.

### 2. Outlook Calendar Setup (Azure Portal)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **App registrations**
3. Use the same app as Outlook Mail or create a new registration
4. Add redirect URI: `exp://localhost:8081`
5. In **API permissions**, add:
   - `Calendars.ReadWrite`
   - `User.Read`
   - `offline_access`
6. Grant admin consent for your organization
7. Use the same client secret as Outlook Mail or create new under **Certificates & secrets**
8. Add environment variables to backend `.env`:
   ```env
   OUTLOOK_CLIENT_ID=your-outlook-client-id
   OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
   OUTLOOK_REDIRECT_URI=exp://localhost:8081
   ```
9. Add to frontend `.env`:
   ```env
   EXPO_PUBLIC_OUTLOOK_CLIENT_ID=your-outlook-client-id
   ```

**Note**: You can use the same Azure app registration for both Outlook Mail and Outlook Calendar by adding all required scopes.

### 3. Apple Calendar Setup (Device Permissions)

Apple Calendar doesn't use OAuth. Instead, it uses device-level permissions through EventKit.

**iOS Setup**:
1. No external OAuth setup required
2. The app will request calendar permissions at runtime
3. Events are managed locally on the device using EventKit

**Required Permissions in app.json/app.config.js**:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-calendar",
        {
          "calendarPermission": "Allow $(PRODUCT_NAME) to access your calendar to manage events."
        }
      ]
    ]
  }
}
```

**Installation**:
```bash
npm install expo-calendar
npx expo install expo-calendar
```

**Note**: Apple Calendar integration works entirely on the device. The backend endpoints simply acknowledge the operations performed locally.

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
   - Scroll to the "Calendar" section

2. **Test Google Calendar Connection**:
   - Tap "Connect" on Google Calendar card
   - Should open Google OAuth flow
   - Sign in with Google account
   - Grant Calendar permissions
   - Should return to app with success message

3. **Test Outlook Calendar Connection**:
   - Tap "Connect" on Outlook Calendar card
   - Should open Microsoft OAuth flow
   - Sign in with Microsoft account (work/school account recommended)
   - Grant Calendar permissions
   - Should return to app with success message

4. **Test Apple Calendar Connection**:
   - Tap "Connect" on Apple Calendar card
   - Should prompt for device calendar permissions
   - Grant calendar access when prompted
   - Should show success message

## Managing Calendar Events

### Fetching Events

#### Google Calendar Example
```typescript
const events = await calendarService.getEvents(
  'google-calendar',
  '2025-10-20T00:00:00Z', // startDate
  '2025-10-30T23:59:59Z', // endDate
  50 // maxResults (optional)
);
// Returns array of CalendarEvent objects
```

#### Outlook Calendar Example
```typescript
const events = await calendarService.getEvents(
  'outlook-calendar',
  '2025-10-20T00:00:00Z',
  '2025-10-30T23:59:59Z',
  50
);
```

#### Apple Calendar Example
```typescript
const events = await calendarService.getEvents(
  'apple-calendar',
  '2025-10-20T00:00:00Z',
  '2025-10-30T23:59:59Z'
);
// Fetches from device calendar using EventKit
```

### Creating Events

#### Google Calendar Example
```typescript
const event = await calendarService.createEvent('google-calendar', {
  title: 'Team Meeting',
  description: 'Weekly team standup',
  startTime: '2025-10-20T10:00:00Z',
  endTime: '2025-10-20T11:00:00Z',
  location: 'Conference Room A',
  attendees: ['teammate@example.com', 'manager@example.com'],
});
// Returns: { id: 'event-id', title: 'Team Meeting', htmlLink: 'https://...' }
```

#### Outlook Calendar Example
```typescript
const event = await calendarService.createEvent('outlook-calendar', {
  title: 'Client Presentation',
  description: 'Q4 results presentation',
  startTime: '2025-10-20T14:00:00Z',
  endTime: '2025-10-20T15:00:00Z',
  location: 'Virtual',
  attendees: ['client@example.com'],
});
// Returns: { id: 'event-id', title: 'Client Presentation', webLink: 'https://...' }
```

#### Apple Calendar Example
```typescript
const event = await calendarService.createEvent('apple-calendar', {
  title: 'Lunch with Friends',
  description: 'Casual lunch',
  startTime: '2025-10-20T12:00:00Z',
  endTime: '2025-10-20T13:00:00Z',
  location: 'Restaurant',
});
// Creates event on device calendar using EventKit
// Returns: { id: 'device-event-id', title: 'Lunch with Friends' }
```

### Updating Events

#### Google Calendar Example
```typescript
await calendarService.updateEvent('google-calendar', 'event-id', {
  title: 'Updated Team Meeting',
  startTime: '2025-10-20T11:00:00Z', // Changed time
  endTime: '2025-10-20T12:00:00Z',
});
```

#### Outlook Calendar Example
```typescript
await calendarService.updateEvent('outlook-calendar', 'event-id', {
  description: 'Updated agenda for Q4 presentation',
  location: 'Microsoft Teams',
});
```

#### Apple Calendar Example
```typescript
await calendarService.updateEvent('apple-calendar', 'device-event-id', {
  title: 'Updated Lunch Plans',
  location: 'Different Restaurant',
});
// Updates event on device calendar
```

### Deleting Events

#### Google Calendar Example
```typescript
await calendarService.deleteEvent('google-calendar', 'event-id');
```

#### Outlook Calendar Example
```typescript
await calendarService.deleteEvent('outlook-calendar', 'event-id');
```

#### Apple Calendar Example
```typescript
await calendarService.deleteEvent('apple-calendar', 'device-event-id');
// Deletes event from device calendar
```

## Backend API Examples

### Create Event via Backend API

**Google Calendar**:
```bash
curl -X POST http://localhost:3000/api/integrations/google-calendar/create-event \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly standup",
    "startTime": "2025-10-20T10:00:00Z",
    "endTime": "2025-10-20T11:00:00Z",
    "location": "Conference Room",
    "attendees": ["team@example.com"]
  }'
```

**Outlook Calendar**:
```bash
curl -X POST http://localhost:3000/api/integrations/outlook-calendar/create-event \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Client Meeting",
    "description": "Quarterly review",
    "startTime": "2025-10-20T14:00:00Z",
    "endTime": "2025-10-20T15:00:00Z",
    "location": "Teams",
    "attendees": ["client@example.com"]
  }'
```

### Update Event via Backend API

**Google Calendar**:
```bash
curl -X PUT http://localhost:3000/api/integrations/google-calendar/update-event/EVENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Team Meeting",
    "startTime": "2025-10-20T11:00:00Z"
  }'
```

**Outlook Calendar**:
```bash
curl -X PATCH http://localhost:3000/api/integrations/outlook-calendar/update-event/EVENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated meeting agenda"
  }'
```

### Delete Event via Backend API

```bash
curl -X DELETE http://localhost:3000/api/integrations/google-calendar/delete-event/EVENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
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

4. **Token Expired**:
   - Implement token refresh logic for expired access tokens
   - Google/Outlook tokens typically expire after 1 hour

5. **Event Creation Fails**:
   - Verify account is properly connected
   - Ensure event times are in correct ISO format
   - Check that start time is before end time
   - Make sure event time is in the future

### Provider-Specific Issues

**Google Calendar**:
- Error: "Calendar not found" → Ensure Google Calendar API is enabled in Cloud Console
- Error: "Insufficient permissions" → Add Calendar scopes to OAuth consent screen
- Error: "Invalid date format" → Use ISO 8601 format (e.g., `2025-10-20T10:00:00Z`)

**Outlook Calendar**:
- Error: "Tenant-specific endpoint required" → User must sign in with work/school account
- Error: "Admin consent required" → Organization admin needs to grant consent
- Error: "Invalid authentication token" → Refresh access token using refresh token

**Apple Calendar**:
- Error: "Calendar permission not granted" → Check device settings for calendar access
- Error: "No calendar available" → Ensure device has at least one calendar configured
- Platform-specific: Only works on iOS/Android devices, not in web browser

### Backend Logs

Monitor backend console for detailed logs:
- `🔐 Exchanging OAuth code...` - OAuth flow started
- `📅 Fetching calendar events...` - Fetching events from API
- `📅 Creating calendar event...` - Creating new event
- `✅ Event created successfully` - Event creation successful
- `❌ Connection error` - Connection or API error with details

### Frontend Logs

Check React Native debugger for:
- `Opening OAuth flow for [provider]` - OAuth initiated
- `OAuth code received` - Code received from provider
- `Calendar provider connected successfully` - Account connected
- `Connected calendar account:` - Account details logged

## Security Notes

1. **Never commit OAuth credentials** to version control
2. **Use HTTPS** for all OAuth redirects in production
3. **Implement token refresh** logic for expired access tokens
4. **Validate redirect URIs** to prevent OAuth hijacking
5. **Store tokens securely** using encrypted storage in production
6. **Implement rate limiting** to prevent API abuse
7. **Sanitize user input** when creating/updating events
8. **Use PKCE (Proof Key for Code Exchange)** for mobile OAuth flows in production

## API Rate Limits

Be aware of provider rate limits:

- **Google Calendar**:
  - 1,000,000 queries per day (free tier)
  - 100 requests per 100 seconds per user
- **Outlook Calendar**:
  - 10,000 requests per 10 minutes per application
  - Variable by endpoint
- **Apple Calendar**:
  - No rate limits (device-side only)
  - Limited by device storage and performance

## Token Expiration and Refresh

### Google Calendar
- Access tokens expire after 1 hour
- Refresh tokens are long-lived (use `offline_access` scope)
- Implement automatic token refresh logic

### Outlook Calendar
- Access tokens expire after 1 hour
- Refresh tokens expire after 90 days of inactivity
- Use `offline_access` scope for refresh tokens

### Apple Calendar
- No tokens (device-level permissions)
- Permissions persist until user revokes them in device settings

## Event Data Schema

### Google Calendar Event
```typescript
{
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  location?: string;
  attendees?: string[]; // Email addresses
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string; // Link to event in Google Calendar
}
```

### Outlook Calendar Event
```typescript
{
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  location?: string;
  attendees?: string[]; // Email addresses
  status: 'confirmed' | 'cancelled';
  isOnline: boolean;
  onlineMeetingUrl?: string; // Teams meeting link
  webLink: string; // Link to event in Outlook
}
```

### Apple Calendar Event
```typescript
{
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  location?: string;
  status?: string;
}
```

## Next Steps

After configuration and testing:

1. **Implement Calendar UI**:
   - Create calendar view screen
   - Add month/week/day views
   - Display events from all connected calendars
   - Add event creation/editing forms

2. **Sync Multiple Calendars**:
   - Fetch events from all connected providers
   - Merge and deduplicate events
   - Color-code events by provider
   - Handle conflicts and overlaps

3. **Event Reminders**:
   - Set up push notifications for upcoming events
   - Allow custom reminder times
   - Sync reminders with device notifications

4. **Recurring Events**:
   - Add support for recurring event patterns
   - Handle exceptions and modifications
   - Sync recurring event series

5. **Calendar Sharing**:
   - Share events with other users
   - Handle event invitations
   - Track RSVP status

6. **Production Deployment**:
   - Update redirect URIs to production URLs
   - Configure proper OAuth consent screens
   - Enable production OAuth scopes
   - Implement comprehensive error handling
   - Set up monitoring and logging
   - Add analytics for calendar usage

## Files Modified

### Backend
- `src/routes/integrations.ts` - All calendar endpoints (Google, Outlook, Apple)
  - Google Calendar: Connect, disconnect, events CRUD (6 endpoints)
  - Outlook Calendar: Connect, disconnect, events CRUD (6 endpoints)
  - Apple Calendar: Connect, disconnect, events acknowledgment (6 endpoints)
  - Status endpoint updated to include calendar statuses

### Frontend
- `src/services/calendarService.ts` - Calendar service with all providers (created new)
  - OAuth flows for Google and Outlook
  - Device permissions for Apple Calendar
  - Event CRUD operations for all providers
  - Local storage management
- `src/screens/IntegrationsScreen.tsx` - UI for connecting calendar accounts
  - Added calendar service import
  - Updated loadConnectedIntegrations to fetch calendar accounts
  - Updated handleConnect to handle calendar OAuth/permissions
- `.env` - Environment variables for OAuth client IDs (already configured)

### Documentation
- `CALENDAR_INTEGRATION_SETUP.md` - This comprehensive setup guide

## Dependencies

Ensure these packages are installed:

```bash
npm install expo-auth-session expo-web-browser expo-calendar
```

**expo-calendar** is required for Apple Calendar integration on iOS/Android.

## Support

For issues or questions:
1. Check backend logs at `C:\Users\papcy\Desktop\yofam\getyo_backend`
2. Check frontend logs in React Native debugger
3. Review provider documentation:
   - [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
   - [Microsoft Graph Calendar](https://docs.microsoft.com/en-us/graph/api/resources/calendar)
   - [Expo Calendar (EventKit)](https://docs.expo.dev/versions/latest/sdk/calendar/)

## Important Notes

- Google Calendar requires Google Calendar API enabled in Cloud Console
- Outlook Calendar works with both personal and work/school accounts
- Apple Calendar requires device-level permissions and only works on iOS/Android
- All times should be in ISO 8601 format (e.g., `2025-10-20T10:00:00Z`)
- Backend endpoints handle OAuth token storage and management
- Frontend service handles OAuth flows and device permissions
- Calendar events can be created, updated, and deleted from the app

## Example Integration Flow

1. **User Connects Google Calendar**:
   - User taps "Connect" on Google Calendar card
   - App opens Google OAuth flow in browser
   - User signs in and grants calendar permissions
   - Google redirects back with authorization code
   - Frontend sends code to backend `/api/integrations/google-calendar/connect`
   - Backend exchanges code for access/refresh tokens
   - Backend stores tokens in user's MongoDB document
   - Frontend receives success response and updates UI

2. **User Creates Event**:
   - User fills out event creation form
   - App calls `calendarService.createEvent()` with event data
   - Service sends request to backend endpoint
   - Backend uses stored access token to call Google Calendar API
   - Google creates event and returns event details
   - Backend returns event data to frontend
   - App displays success message and updates calendar view

3. **User Views Events**:
   - App calls `calendarService.getEvents()` with date range
   - Service requests events from backend
   - Backend fetches events from Google Calendar API
   - Events are returned and displayed in calendar view
   - Events from all connected calendars are merged and displayed

## Testing Checklist

- [ ] Google Calendar OAuth flow completes successfully
- [ ] Outlook Calendar OAuth flow completes successfully
- [ ] Apple Calendar permissions prompt appears and works
- [ ] Events can be fetched from Google Calendar
- [ ] Events can be fetched from Outlook Calendar
- [ ] Events can be fetched from Apple Calendar (device)
- [ ] New events can be created in Google Calendar
- [ ] New events can be created in Outlook Calendar
- [ ] New events can be created in Apple Calendar (device)
- [ ] Events can be updated in all three providers
- [ ] Events can be deleted from all three providers
- [ ] Multiple calendars can be connected simultaneously
- [ ] Calendar connections persist after app restart
- [ ] Token refresh works for expired Google/Outlook tokens
- [ ] Error messages are user-friendly and informative

## Conclusion

Calendar integration is now fully implemented for Google Calendar, Outlook Calendar, and Apple Calendar. Users can connect their calendars, view events, and create/update/delete events directly from your app. The implementation follows OAuth 2.0 best practices for cloud calendars and uses native EventKit for Apple Calendar on devices.
