# 🚀 Ready Player Me Avatar - Quick Start

## ⚡ 3-Step Setup (2 Minutes)

### Step 1: Create Your Avatar
```
1. Visit: https://readyplayer.me/
2. Click "Create Avatar"
3. Customize your character
4. Copy the URL (looks like: https://models.readyplayer.me/ABC123.glb)
```

### Step 2: Configure Your App
Open: `src/screens/HomeScreen.tsx`

Find lines 38-39 and update:
```tsx
// BEFORE:
const AVATAR_URL = 'https://models.readyplayer.me/YOUR-AVATAR-ID.glb';
const USE_READY_PLAYER_ME = false;

// AFTER (replace ABC123 with your actual ID):
const AVATAR_URL = 'https://models.readyplayer.me/ABC123.glb';
const USE_READY_PLAYER_ME = true;  // ← Change to true!
```

### Step 3: Test
```bash
npx expo start
# Press 'r' to reload
```

---

## ✅ What You'll See

1. **Loading** (1-2 seconds): "Loading 3D Avatar..."
2. **Avatar appears**: Your custom 3D character
3. **Voice greeting** (after 1.5s): "Hey! I'm [name]!"
4. **Speech bubble**: Shows greeting text
5. **Returns to idle**: After 4 seconds

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Please configure..." error | Replace `YOUR-AVATAR-ID` with actual ID |
| Avatar not showing | Set `USE_READY_PLAYER_ME = true` |
| Infinite loading | Check internet connection + avatar URL |
| No voice | Check device volume, silent mode off |
| Character too small | Edit `HomeScreen.tsx` line 1163 (increase width/height) |

---

## 🎨 Quick Customizations

### Change Greeting Message
`HomeScreen.tsx` - Line 168:
```tsx
const greeting = `Your custom message here!`;
```

### Change Character Size
`HomeScreen.tsx` - Line 1163:
```tsx
characterContainer: {
  width: 350,   // Bigger (currently 280)
  height: 450,  // Taller (currently 320)
},
```

### Change Voice Settings
`HomeScreen.tsx` - Line 172:
```tsx
Speech.speak(greeting, {
  language: 'en-US',
  pitch: 1.2,    // Higher = chipmunk voice
  rate: 1.0,     // Faster speech (0.5 = slow, 2.0 = fast)
});
```

### Disable Auto-Greeting
`HomeScreen.tsx` - Lines 162-184:
```tsx
// Comment out this entire useEffect block:
// useEffect(() => { ... }, [user?.assistantName]);
```

---

## 📋 What's Working

- ✅ 3D character display (full body, not circular)
- ✅ Voice greeting with text-to-speech
- ✅ Speech bubble animation
- ✅ 4 animation states (idle, listening, talking, thinking)
- ✅ Loading states and error handling
- ✅ Auto-greeting on app load
- ✅ Interactive states (tap to cycle, long press for AI)

---

## 🔗 Resources

- **Full Guide:** `READY_PLAYER_ME_SETUP.md`
- **Ready Player Me:** https://readyplayer.me/
- **API Key:** `sk_live__Z9q0KcIv_-imgvexMgk1ICK23OzQaiDi0Yw`

---

## 📞 Need Help?

1. Read `READY_PLAYER_ME_SETUP.md` (comprehensive guide)
2. Check console logs in Metro bundler
3. Try: `npx expo start --clear` (clears cache)
4. Verify avatar URL in browser

---

**That's it! You're done!** 🎉

Your 3D Memoji-style avatar is ready to greet you! 🗣️
