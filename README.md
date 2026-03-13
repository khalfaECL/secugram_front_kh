# Secugram

> A privacy-first image sharing mobile app built with React Native.
> Images are encrypted server-side with AES-256 and watermarked before storage. Sessions are ephemeral — no data is ever persisted on-device.

---

## Overview

Secugram is a secure photo-sharing application where the owner of an image explicitly controls who can view it. The mobile frontend handles authentication and authorization flow; all cryptographic operations (AES-256 encryption + invisible watermarking) happen on the backend.

**Security principles:**
- JWT sessions stored in memory only — cleared on app close
- No AsyncStorage, no local file cache, no credentials on device
- Per-image access control list — each photo has an explicit list of authorized viewers
- Images transmitted as base64 to the API; the server encrypts before storage

---

## Architecture

```
secugram-rn/
├── src/
│   ├── api/               # REST client (auth, photos, users)
│   ├── hooks/
│   │   ├── useAuth.js     # AuthContext — login, register, logout, demoLogin
│   │   └── useTheme.js    # ThemeContext — light/dark toggle
│   ├── navigation/
│   │   └── AppNavigator.js  # Bottom tabs + auth gate
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── FeedScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   │   ├── UI.js            # Shared components (Button, Avatar, Chip…)
│   │   └── UploadModal.js   # Multi-step photo upload + authorization picker
│   └── theme/
│       └── index.js         # DarkColors, LightColors, Radius, Spacing
├── android/
├── App.js
└── package.json
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| JDK | 17 (for Android builds) |
| Android Studio | Hedgehog or newer |
| Android SDK | API 33+ |
| NDK | 26.x |

---

## Getting Started

### 1. Install dependencies

```bash
cd secugram-rn
npm install
```

### 2. Configure Android SDK path

Create `secugram-rn/android/local.properties`:

```
sdk.dir=C:\Users\<YourName>\AppData\Local\Android\Sdk
```

### 3. Start Metro bundler

```bash
npm start
```

### 4. Run on Android

```bash
npm run android
```

> **Emulator tip:** if the emulator is slow, launch it with software rendering:
> ```
> emulator -avd <your_avd_name> -gpu swiftshader_indirect
> ```

---

## API Endpoints

The frontend connects to `http://10.0.2.2:3000/api` (Android emulator alias for `localhost`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate, receive JWT |
| `POST` | `/api/auth/register` | Create account, receive JWT |
| `GET` | `/api/users` | List users (authorization picker) |
| `GET` | `/api/photos` | Fetch current user's photo feed |
| `POST` | `/api/photos/upload` | Upload photo (base64) → encrypted server-side |
| `POST` | `/api/photos/:id/authorize` | Set authorized viewers for a photo |
| `DELETE` | `/api/photos/:id` | Delete a photo |

All endpoints except auth require `Authorization: Bearer <token>`.

---

## Demo Mode

No backend? Use the **instant demo login** on the login screen.

It creates a local mock session (`alice_dupont`) without any API call, giving full access to all screens and UI flows.

---

## Themes

The app ships with both light and dark themes. Light is the default.
Toggle via the ☀️ / 🌙 button in the app header or profile screen.

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FFFFFF` | `#000000` |
| Accent | `#FF6B00` | `#FF6B00` |
| Text primary | `#000000` | `#FFFFFF` |
| Surface | `#F5F5F5` | `#0D0D0D` |

---

## Tech Stack

- **React Native** 0.76.5
- **React Navigation** 6 — bottom tabs
- **react-native-image-picker** — photo library access
- **react-native-safe-area-context** / **react-native-screens**
- JWT authentication (in-memory, no persistence)
- AES-256 encryption (server-side, outside this repo)

---

## License

KHALFA youssef
KRID Amani
AGREBI Marwane
CHAMMAKHI Malek

Ecole Centrale Lyon
