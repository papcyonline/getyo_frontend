# Yo! Personal Assistant - Mobile App

A powerful React Native mobile application for iOS and Android built with Expo. Features an AI-powered personal assistant with voice interaction, task management, and intelligent conversation capabilities.

## 🚀 Features

### Core Functionality
- **AI Assistant**: Conversational AI powered by Claude (Anthropic)
- **Voice Interaction**: Voice commands and text-to-speech responses
- **Task Management**: Create, organize, and track tasks with priorities
- **Event Management**: Calendar events with reminders and notifications
- **Note Taking**: Quick notes with rich text support
- **Smart Reminders**: Location and time-based reminders

### User Experience
- **Personalized Assistant**: Customize assistant name, voice, and personality
- **Voice Wake Word**: Activate assistant with "Yo [Assistant Name]"
- **Real-time Sync**: WebSocket integration for instant updates
- **Offline Support**: Works offline with local data caching
- **Dark Mode**: Beautiful dark interface optimized for mobile

### Authentication
- **Phone Verification**: SMS OTP via Twilio
- **Email Verification**: Email OTP via Resend
- **Secure Login**: JWT-based authentication
- **Biometric Support**: Touch ID / Face ID (coming soon)

### Integration
- **Google Calendar**: Sync events and reminders
- **Contacts**: Access contacts for quick actions
- **Location Services**: Location-based reminders
- **Push Notifications**: Real-time alerts and reminders

## 📋 Prerequisites

- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Studio
- Physical device for testing (recommended)

## 🛠 Installation

1. **Clone the repository**
```bash
git clone https://github.com/papcyonline/getyo_frontend.git
cd getyo_frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.1.120:3000
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.120:3000

# Google OAuth (for Calendar integration)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

4. **Start the development server**

```bash
npm start
```

Or use specific commands:
```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## 📱 Running on Device

### iOS
1. Install Expo Go from the App Store
2. Scan the QR code from the terminal
3. App will load on your device

### Android
1. Install Expo Go from Google Play
2. Scan the QR code from the terminal
3. App will load on your device

## 🏗 Project Structure

```
yo-app/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/         # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── AIAssistantScreen.tsx
│   │   ├── OTPVerificationScreen.tsx
│   │   └── ...
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API services
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── connectionManager.ts
│   │   ├── conversationManager.ts
│   │   └── wakeWordService.ts
│   ├── store/          # Redux store
│   │   ├── index.ts
│   │   ├── userSlice.ts
│   │   └── themeSlice.ts
│   ├── types/          # TypeScript types
│   └── utils/          # Helper functions
├── assets/             # Images, fonts, etc.
├── App.tsx            # App entry point
├── app.json           # Expo configuration
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript config
```

## 🔧 Key Technologies

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **Redux Toolkit**: State management
- **React Navigation**: Navigation library
- **Socket.IO**: Real-time communication
- **Axios**: HTTP client
- **AsyncStorage**: Local data storage
- **Expo AV**: Audio recording and playback
- **React Native Voice**: Voice recognition

## 📡 API Integration

The app connects to the backend API for:
- User authentication
- Task and event management
- AI conversation processing
- Voice transcription and synthesis
- Real-time updates via WebSocket

**Backend Repository**: https://github.com/papcyonline/getyo_backend

## 🎨 Screens

### Authentication Flow
1. **Welcome Screen**: App introduction
2. **Phone Input**: Enter phone number
3. **OTP Verification**: Verify phone with SMS code
4. **Email Input**: Enter email address
5. **Email Verification**: Verify email with code
6. **Password Creation**: Set secure password
7. **Assistant Setup**: Customize assistant name and voice

### Main App
1. **Home Screen**: Task dashboard with today's agenda
2. **AI Assistant**: Chat interface with voice support
3. **Tasks Screen**: Full task management
4. **Events Screen**: Calendar and event management
5. **Notes Screen**: Quick note taking
6. **Settings**: App preferences and account management

## 🔐 Security Features

- **Secure Storage**: Sensitive data encrypted in AsyncStorage
- **Token Management**: JWT tokens with automatic refresh
- **OTP Verification**: Required for phone and email
- **Network Security**: HTTPS for all API calls
- **Input Validation**: Client-side validation for all forms

## 🧪 Testing

### Development Build
For testing native features (voice, camera, etc.):
```bash
eas build --profile development
```

### Production Build
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

## 📦 Building for Production

### iOS
1. Configure app signing in `app.json`
2. Run build command:
```bash
eas build --platform ios
```
3. Submit to App Store:
```bash
eas submit --platform ios
```

### Android
1. Configure app signing
2. Run build command:
```bash
eas build --platform android
```
3. Submit to Google Play:
```bash
eas submit --platform android
```

## 🔄 State Management

The app uses Redux Toolkit for state management:

### Slices
- **User Slice**: User profile and authentication state
- **Theme Slice**: Dark/light mode preferences
- **Connection Slice**: Network and API connection status

### Usage Example
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from './store/userSlice';

const user = useSelector((state: RootState) => state.user.user);
const dispatch = useDispatch();

dispatch(setUser(userData));
```

## 🎤 Voice Features

### Wake Word Detection
- Activate with "Yo [Assistant Name]"
- Requires development build (not available in Expo Go)
- Uses on-device speech recognition

### Voice Commands
- Natural language processing
- Hands-free task creation
- Voice-to-text conversion

## 📱 Network Management

The app includes intelligent connection management:
- Automatic reconnection on network change
- Offline mode with data caching
- Real-time connection status
- Fallback to cached data

## 🚧 Known Issues

1. **Expo Go Limitations**: Wake word detection requires development build
2. **Voice Module**: Some voice features need native modules
3. **WebSocket**: May disconnect on network changes (auto-reconnects)

## 🔮 Upcoming Features

- [ ] Biometric authentication (Touch ID / Face ID)
- [ ] Location-based reminders
- [ ] Calendar widget
- [ ] Siri Shortcuts integration
- [ ] Apple Watch companion app
- [ ] Widget support
- [ ] Offline AI mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Papcy Online.

## 👥 Contact

- **Email**: info@papcy.com
- **GitHub**: [@papcyonline](https://github.com/papcyonline)

## 🙏 Acknowledgments

- Expo team for the excellent development platform
- React Native community
- Anthropic for Claude AI
- OpenAI for voice services

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Backend API Docs](https://github.com/papcyonline/getyo_backend)

---

Built with ❤️ by Papcy Online | Powered by Claude Code