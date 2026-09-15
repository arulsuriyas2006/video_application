# VideoFlow — Video Collaboration & Review Platform

VideoFlow is an original, modern SaaS platform designed for video agencies, editors, freelancers, and clients. It provides frame-accurate video review, visual canvas annotations, timestamped feedback, voice notes, version management, and client approval workflows—running 100% locally with zero paid cloud dependencies.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS, Lucide React, React Router v6, Axios, Socket.IO Client, HTML5 Video API, HTML Canvas API, MediaRecorder API.
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Multer, Socket.IO, fluent-ffmpeg (`@ffmpeg-installer/ffmpeg` + `@ffprobe-installer/ffprobe` local binaries).
- **Local Storage Engine**:
  - Videos: `server/uploads/videos/`
  - Thumbnails: `server/uploads/thumbnails/`
  - Voice Audio: `server/uploads/audio/`

---

## 🚀 Quick Start Instructions

### Prerequisites
1. **Node.js**: v18+ (tested on Node v24)
2. **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017`

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 3. Run the Servers

**Start Backend (`http://localhost:5000`):**
```bash
cd server
npm run dev
# or npm start
```

**Start Frontend (`http://localhost:5173`):**
```bash
cd client
npm run dev
```

---

## 📡 API Health Check

Test the live backend & database status:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "service": "VideoFlow API Server",
    "version": "1.0.0",
    "uptimeSeconds": 12,
    "database": {
      "status": "connected",
      "uri": "mongodb://127.0.0.1:27017/videoflow",
      "connected": true
    }
  }
}
```

---

## 📂 Project Structure
```text
videoflow/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Global state (Auth, Socket)
│   │   ├── pages/              # Route views
│   │   ├── services/           # Axios & Socket client
│   │   ├── App.jsx
│   │   ├── index.css           # Tailwind + design tokens
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # DB & environment config
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, Error handlers
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # REST API routes
│   │   ├── services/           # FFmpeg & video processing
│   │   └── server.js           # Server & Socket.io entry point
│   ├── uploads/                # Local media directories
│   │   ├── audio/
│   │   ├── thumbnails/
│   │   └── videos/
│   ├── .env
│   ├── .env.example
│   └── package.json
└── README.md
```
