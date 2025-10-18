# Voice Input Implementation Guide

## Overview
The voice input feature allows users to dictate task titles and descriptions using their device's microphone. The audio is recorded, sent to the backend, transcribed using OpenAI Whisper, and the text is automatically populated in the task form.

## Architecture

### Frontend (React Native)
- **Service**: `src/services/voiceRecording.ts`
- **Component**: `src/screens/AddTaskScreen.tsx`
- **Package**: `expo-av` (for audio recording)

### Backend (Node.js/Express)
- **Routes**:
  - `/api/voice/process` - Simple transcription
  - `/api/transcription/whisper` - OpenAI Whisper transcription
  - `/api/voice/process-command` - Advanced voice command processing
- **Services**:
  - `src/services/openaiService.ts` - OpenAI Whisper integration
  - `src/services/transcriptionService.ts` - Transcription handling
  - `src/services/VoiceProcessingService.ts` - Voice processing logic

## API Endpoints

### 1. Simple Transcription: `POST /api/transcription/whisper`
**Purpose**: Transcribe audio file to text

**Request**:
```typescript
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- audio: File (m4a, mp3, wav, webm, ogg)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "text": "Buy groceries tomorrow",
    "confidence": 0.95,
    "service": "whisper",
    "processingTimeMs": 1234,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### 2. Voice Command Processing: `POST /api/voice/process-command`
**Purpose**: Transcribe and automatically create tasks/reminders/events

**Request**:
```json
{
  "audioData": "base64_encoded_audio_data",
  "audioFormat": "wav"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transcription": "Create a task to buy groceries tomorrow",
    "action": "create_task",
    "entity": {
      "id": "task_123",
      "title": "Buy groceries",
      "dueDate": "2025-01-16T09:00:00.000Z",
      "priority": "medium"
    },
    "confidence": 0.92,
    "message": "Task created: 'Buy groceries' due Jan 16"
  }
}
```

## Frontend Implementation

### Voice Recording Service
Located at: `src/services/voiceRecording.ts`

**Key Methods**:
- `requestPermissions()` - Request microphone access
- `startRecording()` - Start audio recording
- `stopRecording()` - Stop and return audio URI
- `cancelRecording()` - Cancel recording without saving
- `transcribeAudio(uri)` - Send audio to backend for transcription

### AddTaskScreen Integration
Located at: `src/screens/AddTaskScreen.tsx`

**Flow**:
1. User taps mic button in header
2. `handleVoiceInput()` is called
3. If not recording:
   - Request microphone permission
   - Start recording
   - Show recording indicator (button turns gold)
   - Display alert with cancel option
4. If already recording:
   - Stop recording
   - Send audio to backend `/api/transcription/whisper`
   - Parse response and populate title field
   - Show success/error message

**UI Elements**:
- Mic button in header (right side)
- Visual feedback: gold highlight when recording
- Guide text: "Tap the mic to dictate or type your task below"

## Backend Configuration

### Required Environment Variables
```bash
OPENAI_API_KEY=sk-...  # Required for Whisper transcription
ANTHROPIC_API_KEY=...  # Optional (for Claude features)
```

### OpenAI Whisper Setup
The backend uses OpenAI's Whisper API for transcription:
- **Model**: `whisper-1`
- **Language**: English (configurable)
- **Format**: Text
- **Max File Size**: 25MB
- **Supported Formats**: m4a, mp3, wav, webm, ogg

### Transcription Service
Located at: `src/services/transcriptionService.ts`

**Features**:
- Automatic fallback to mock transcription (for testing)
- Health check endpoint
- Multiple service support (Whisper, VAPI.AI)
- File cleanup after processing

## Testing

### 1. Test Transcription Health
```bash
GET /api/transcription/health
Authorization: Bearer <token>
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "whisper": true,
    "vapi": false,
    "status": "healthy",
    "availableServices": ["whisper", "mock"]
  }
}
```

### 2. Test Mock Transcription
```bash
GET /api/transcription/test
Authorization: Bearer <token>
```

### 3. Test Real Voice Input
1. Open AddTaskScreen in app
2. Tap mic button (top right)
3. Grant microphone permission
4. Speak: "Buy groceries tomorrow"
5. Tap mic button again to stop
6. Verify transcribed text appears in title field

## Error Handling

### Frontend Errors
- **No Permission**: Alert shown, user directed to settings
- **Recording Failed**: Alert with retry option
- **Transcription Failed**: Alert with error message
- **Network Error**: Handled by apiService error interceptor

### Backend Errors
- **Missing Audio**: 400 Bad Request
- **File Too Large**: 400 Bad Request (25MB limit)
- **Invalid Format**: 400 Bad Request
- **OpenAI API Error**: 500 Internal Server Error
- **Rate Limit**: 429 Too Many Requests (handled by OpenAI SDK)

## Permissions

### iOS (app.json / Info.plist)
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app needs access to your microphone to record voice input for tasks."
      }
    }
  }
}
```

### Android (app.json / AndroidManifest.xml)
```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO"
      ]
    }
  }
}
```

## Performance Considerations

### Audio File Size
- **HIGH_QUALITY preset**: ~1-2MB per minute
- **Compression**: Audio is compressed before upload
- **Network**: Uses existing API retry logic

### Transcription Time
- **Whisper API**: Typically 2-5 seconds for 30 second audio
- **Real-time feedback**: "Processing" alert shown during transcription
- **Timeout**: 30 seconds (configurable in apiService)

## Future Enhancements

### Planned Features
1. **Real-time transcription** - Show text as user speaks
2. **Multiple languages** - Support 50+ languages via Whisper
3. **Voice commands** - "Set priority to high", "Add tag work"
4. **Continuous recording** - Hold to record, release to stop
5. **Audio waveform** - Visual feedback during recording
6. **Speech-to-text caching** - Cache common phrases

### Alternative Services
- **Google Speech-to-Text** - Lower latency, more languages
- **Azure Speech Services** - Enterprise features
- **AWS Transcribe** - Batch processing support
- **AssemblyAI** - Real-time streaming

## Troubleshooting

### Issue: "Permission not granted"
**Solution**:
- iOS: Settings → Your App → Microphone → Enable
- Android: Settings → Apps → Your App → Permissions → Microphone

### Issue: "Failed to transcribe audio"
**Check**:
1. Backend server is running
2. OPENAI_API_KEY is set correctly
3. OpenAI account has credits
4. Audio file is valid format
5. Network connection is stable

### Issue: "Recording starts but doesn't stop"
**Solution**:
- Force close app
- Clear app data
- Check Audio.setAudioModeAsync settings

### Issue: "Backend returns 500 error"
**Check**:
1. Backend logs: `npm run dev`
2. OpenAI API status: status.openai.com
3. File permissions in uploads/audio directory
4. Disk space available

## API Usage & Costs

### OpenAI Whisper Pricing
- **$0.006 per minute** (rounded to nearest second)
- Example: 100 recordings × 30 seconds = $0.30

### Rate Limits
- **50 requests per minute** (free tier)
- **500 requests per minute** (paid tier)

### Best Practices
- Limit recording to 60 seconds max
- Add debounce to prevent rapid API calls
- Cache common transcriptions
- Implement client-side audio compression

## Security Considerations

1. **Audio is not stored** - Deleted immediately after transcription
2. **HTTPS only** - All API calls encrypted in transit
3. **Auth required** - JWT token required for all endpoints
4. **Rate limiting** - Prevents abuse
5. **Input validation** - File size, format, and content checked

## Support

For issues or questions:
- Frontend: Check React Native logs
- Backend: Check Node.js console logs
- OpenAI: status.openai.com
- Documentation: docs.expo.dev/versions/latest/sdk/av/

## Version History

- **v1.0.0** (2025-01-15)
  - Initial implementation
  - OpenAI Whisper integration
  - Basic voice-to-text for task titles
  - iOS and Android support
