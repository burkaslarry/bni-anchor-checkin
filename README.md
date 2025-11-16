# 🎯 BNI Anchor Checkin - QR Code Attendance PWA

A progressive web app (PWA) for fast, mobile-first QR code attendance tracking at BNI Anchor meetings. Record member and guest check-ins with instant feedback, automatic offline queueing, and real-time sync.

## ✨ Features

### 📱 Core Functionality
- **QR Code Scanning** - Live camera preview with auto-detection
- **Manual Entry Fallback** - Type or paste QR data when scanning fails
- **Member Check-in** - BNI Anchor members with unique IDs
- **Guest Check-in** - Visitors referred by members
- **Search Capabilities** - Lookup attendance by member name or event date

### 🚀 PWA Features
- **Offline Support** - Scans queue locally when offline
- **Auto-Sync** - Automatically syncs queued scans when online
- **Install to Home Screen** - Add to device home screen like a native app
- **Service Worker** - Cached assets for fast loading

### 🎨 User Experience
- **Mobile-First Design** - Optimized for touch on any device
- **Dark Mode UI** - Modern, eye-friendly interface
- **Real-time Feedback** - Toast notifications for all actions
- **Large Touch Targets** - Easy to tap buttons and controls
- **Quick Test Buttons** - One-click payload generation for testing

---

## 🚀 Quick Start

### Prerequisites
- Node.js v22.12.0+ (or v20.19.0+)
- npm v10.9.0+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bni-anchor-checkin

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📋 QR Code Format

### Member Check-in
```json
{
  "name": "larrylo",
  "time": "2025-11-16T10:30:00.000Z",
  "type": "member",
  "membershipId": "ANCHOR-001"
}
```

### Guest Check-in
```json
{
  "name": "karinyeung",
  "time": "2025-11-16T10:30:00.000Z",
  "type": "guest",
  "referrer": "larrylo"
}
```

**See `QR_CODE_FORMAT.md` for detailed documentation.**

---

## 🧪 Testing

### Using Quick Test Buttons
1. Navigate to **Scan QR Code** section
2. Scroll to **"Quick Test Payloads"**
3. Click:
   - 👤 **Member (larrylo)** - BNI member check-in
   - 👥 **Guest (karinyeung)** - Guest check-in
4. Click **Submit** to send

### Manual Testing
1. Copy a JSON example from `QR_CODE_FORMAT.md`
2. Paste into the **"Manual payload"** field
3. Click **Submit**

### Real QR Codes
Use https://www.qr-code-generator.com/:
1. Select "Text" mode
2. Paste JSON payload
3. Generate QR code
4. Scan with the app

---

## 🏗️ Project Structure

```
bni-anchor-checkin/
├── src/
│   ├── components/
│   │   ├── ScanPanel.tsx           # QR scanner UI
│   │   ├── SearchMemberPanel.tsx   # Member search
│   │   ├── SearchEventPanel.tsx    # Event date search
│   │   └── NotificationStack.tsx   # Toast notifications
│   ├── hooks/
│   │   └── useOfflineQueue.ts      # Offline queueing logic
│   ├── api.ts                      # API client
│   ├── qr-format.ts                # QR payload generation
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── styles.css                  # Global styles
├── public/
│   ├── icon.svg                    # App icon
│   └── manifest.webmanifest        # PWA manifest
├── dist/                           # Production build
├── index.html                      # HTML entry point
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite config
├── QR_CODE_FORMAT.md              # QR format guide
└── README.md                       # This file
```

---

## 🔧 Available Scripts

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7.2** - Build tool
- **Vite PWA Plugin** - Service worker generation
- **CSS 3** - Styling with CSS variables

---

## 📱 API Integration

### Endpoint: `POST /api/attendance/scan`

**Request:**
```json
{
  "qrPayload": "{\"name\":\"larrylo\",\"time\":\"2025-11-16T10:30:00.000Z\",\"type\":\"member\",\"membershipId\":\"ANCHOR-001\"}"
}
```

**Response (Success):**
```json
{
  "message": "Attendance recorded successfully"
}
```

### Other Endpoints

- `GET /api/attendance/member?name=XXX` - Search member attendance
- `GET /api/attendance/event?date=YYYY-MM-DD` - Search event attendance

---

## 🌐 Offline Support

When network is unavailable:
- Scans are automatically queued to browser `localStorage`
- Status shows "X scans waiting to sync"
- When online, scans auto-sync
- Notifications confirm sync completion

---

## 🎨 Customization

### Colors
Edit CSS variables in `src/styles.css`:
```css
:root {
  --bg: #030712;           /* Background */
  --accent: #38bdf8;       /* Primary color */
  --success: #22c55e;      /* Success color */
  --error: #ef4444;        /* Error color */
  /* ... more variables ... */
}
```

### App Configuration
Edit `vite.config.ts` for PWA settings:
- App name
- Icons
- Display mode
- Theme colors

---

## 📖 Documentation

- **`QR_CODE_FORMAT.md`** - Detailed QR code format guide
- **`src/qr-format.ts`** - TypeScript interfaces for payloads
- **`src/api.ts`** - API client documentation

---

## ✅ Testing Checklist

- [ ] QR code camera scanning works
- [ ] Manual payload entry works
- [ ] Member check-in records attendance
- [ ] Guest check-in records attendance
- [ ] Offline queueing works (disable network, scan, check localStorage)
- [ ] Auto-sync works (enable network, see queued scans sync)
- [ ] Search by member name returns results
- [ ] Search by event date returns results
- [ ] Notifications display correctly
- [ ] App can be installed to home screen
- [ ] Service worker caches assets
- [ ] Dark mode UI displays correctly

---

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

Generated files in `dist/`:
- `index.html` - Main entry point
- `assets/` - Bundled JS and CSS
- `sw.js` - Service worker
- `manifest.webmanifest` - PWA manifest

### Deploy Options
- **Vercel** - `vercel deploy`
- **Netlify** - `netlify deploy --prod`
- **Any static host** - Copy `dist/` folder

### HTTPS Required
PWA features (camera access, service workers) require HTTPS in production.

---

## 📝 Environment Variables

Currently uses relative URLs for API:
- `POST /api/attendance/scan`
- `GET /api/attendance/member?name=XXX`
- `GET /api/attendance/event?date=YYYY-MM-DD`

To use absolute URLs, update `src/api.ts`:
```typescript
const API_BASE = process.env.VITE_API_URL || 'https://api.example.com';
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not working | Check browser permissions, ensure HTTPS (except localhost) |
| QR not scanning | Try moving closer/farther, ensure good lighting |
| Manual entry fails | Verify JSON is valid, check no extra spaces |
| Offline mode not queuing | Ensure localStorage is enabled in browser |
| Sync not happening | Check network connection, reload app |
| App not installing | Use HTTPS, ensure manifest is valid |

---

## 📄 License

ISC License

---

## 👥 Contributors

- BNI Anchor Team

---

## 🔗 Links

- **QR Code Generator**: https://www.qr-code-generator.com/
- **PWA Documentation**: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **React Documentation**: https://react.dev
- **Vite Documentation**: https://vitejs.dev

---

## 📞 Support

For issues or questions:
1. Check `QR_CODE_FORMAT.md` for format questions
2. Review troubleshooting section above
3. Check browser console for errors (F12)
4. Ensure API endpoint is accessible

---

**Happy Checking In! 🎉**

