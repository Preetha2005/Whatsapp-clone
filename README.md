# WhatsApp Web Clone — Full Featured

A full-stack real-time chat app with image/audio sharing, AI assistant, dark/light theme, and interactive profile.

## ✨ Features
- **Real-time messaging** via Socket.IO
- **Image & Audio sharing** (upload and send media)
- **Meta AI Assistant** powered by Claude AI
- **Dark & Light theme** toggle (persists across sessions)
- **Interactive Profile** page (name, bio, avatar color)
- **Online/Offline** presence indicators
- **Typing indicators**
- **JWT Authentication**
- **MongoDB** message persistence

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Axios, Socket.IO Client |
| Backend | Node.js, Express, Socket.IO, Multer |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Anthropic Claude API (claude-3-haiku) |

## Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Anthropic API key (for AI feature) — get one at https://console.anthropic.com

## Setup Instructions

### 1. Extract the ZIP and open a terminal in the project folder

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # (Windows: copy .env.example .env)
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/whatsapp_clone
JWT_SECRET=any_long_random_string
CLIENT_URL=http://localhost:5173
AI_API_KEY=sk-ant-xxxxxxxxxxxx   ← your Anthropic API key
```

Start backend:
```bash
npm run dev
```
✅ Should print: `MongoDB connected` and `Server running on port 5000`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env   # (Windows: copy .env.example .env)
```

Start frontend:
```bash
npm run dev
```
✅ Open http://localhost:5173

### 4. Test the App
1. Register **User A** in normal browser
2. Register **User B** in incognito window
3. Click each other's name → chat in real time
4. Use the 📷 image button to send photos
5. Use the 🎵 audio button to send audio files
6. Click **Meta AI** at the top of the sidebar to chat with AI
7. Click your avatar (top-left) to open Profile settings
8. Click the ☀️/🌙 icon in the header to toggle theme

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/users | Get all users |
| GET | /api/users/me | Current user profile |
| PUT | /api/users/profile | Update profile |
| GET | /api/messages/:userId | Get conversation |
| POST | /api/messages | Send message |
| POST | /api/upload | Upload image/audio |
| POST | /api/ai/chat | AI assistant chat |

## File Upload Limits
- Images: JPEG, PNG, GIF, WebP — max 10MB
- Audio: MP3, WAV, OGG, WebM — max 10MB

## Project Structure
```
whatsapp-clone/
├── backend/
│   ├── models/         User.js, Message.js
│   ├── routes/         auth, users, messages, upload, ai
│   ├── socket/         Real-time handler
│   ├── uploads/        Uploaded files (auto-created)
│   └── server.js
└── frontend/
    └── src/
        ├── components/ Sidebar, ChatWindow, AIChat, ProfileModal
        ├── pages/      Auth, Chat
        └── context/    Auth, Socket, Theme
```
