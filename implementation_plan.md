# VideoFlow — Video Collaboration & Review Platform (Phase 1 & Overall Architecture)

VideoFlow is a full-stack, real-time video collaboration and review platform tailored for video agencies, editors, freelancers, and clients. It provides frame-accurate timestamp feedback, visual canvas annotations, voice feedback, version management, and client approval workflows—all running locally with zero paid third-party dependencies.

---

## Technical Stack & Architecture

- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, Multer, fluent-ffmpeg with local binary fallback (`@ffmpeg-installer/ffmpeg`), JWT + HTTP-Only cookie auth, Helmet, CORS.
- **Frontend**: React 18 / 19, Vite, Tailwind CSS, Lucide React, React Router v6, Axios, Socket.IO Client, HTML5 Video API, HTML Canvas API, MediaRecorder API.
- **Data Persistence & Local Media**:
  - MongoDB: `mongodb://127.0.0.1:27017/videoflow`
  - Video files: `server/uploads/videos/`
  - Thumbnails: `server/uploads/thumbnails/`
  - Audio voice notes: `server/uploads/audio/`
- **Port Allocation**:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:5000`

---

## Multi-Phase Roadmap

1. **Phase 1 (Current Target)**: Project setup, folder structure, Express server with MongoDB connection, health check API, React + Vite frontend with Tailwind CSS design tokens, and local connectivity validation.
2. **Phase 2**: Authentication & User Roles (Admin, Editor, Client), JWT auth, HTTP-only cookies, password hashing with bcrypt, protected routes, RBAC.
3. **Phase 3**: Admin & Editor Management (Clients CRUD, Projects CRUD, assignment, priority & status management).
4. **Phase 4**: Local Video Upload & FFmpeg Processing (Multer streaming, metadata extraction, auto thumbnail generation).
5. **Phase 5**: Video Review Player (Frame-accurate timeline, playback controls, comment markers, sidebar).
6. **Phase 6**: Comment Collaboration (Threaded replies, resolve/reopen workflows, activity logging).
7. **Phase 7**: Canvas Annotation Overlay (Free draw, arrows, rectangles, circles, highlights, normalized coordinate mapping).
8. **Phase 8**: Voice Feedback (MediaRecorder recording, audio waveform/player, timestamp attachments).
9. **Phase 9**: Version Management (V1, V2, V3, Final switching, comparison, version history).
10. **Phase 10**: Real-Time Socket.IO (Live comments, instant notifications, project room broadcasting).
11. **Phase 11**: Secure Client Review Links (Token-based client review portal, approvals, change requests).
12. **Phase 12**: Polish, Seed Data, Security & Comprehensive Documentation.

---

## Phase 1 Implementation Details

### 1. Backend (`server/`)
- Initialize Node.js project with `package.json`.
- Configure `src/config/db.js` for robust Mongoose connection to `mongodb://127.0.0.1:27017/videoflow`.
- Setup `src/server.js` with Express, CORS, Helmet, Morgan, JSON body parsing, Socket.io initialization, and error handling middleware.
- Implement `/api/health` endpoint returning server uptime, database status, memory stats, and environment info.
- Prepare upload directory structure (`uploads/videos`, `uploads/thumbnails`, `uploads/audio`).
- Create `.env` and `.env.example`.

### 2. Frontend (`client/`)
- Initialize Vite React project.
- Configure Tailwind CSS with custom design system tokens (dark slate background `#090d16`, vibrant indigo/cyan accents `#6366f1` / `#06b6d4`, glassmorphism styles, custom glowing badges).
- Setup Axios API client pointing to `http://localhost:5000/api`.
- Create a modern, responsive initial layout with live connection testing to the backend and MongoDB status indicator.

---

## Proposed File Changes for Phase 1

### Backend Files
- [NEW] [server/package.json](file:///c:/Dhanush/server/package.json)
- [NEW] [server/.env.example](file:///c:/Dhanush/server/.env.example)
- [NEW] [server/.env](file:///c:/Dhanush/server/.env)
- [NEW] [server/src/config/db.js](file:///c:/Dhanush/server/src/config/db.js)
- [NEW] [server/src/middleware/errorHandler.js](file:///c:/Dhanush/server/src/middleware/errorHandler.js)
- [NEW] [server/src/routes/healthRoutes.js](file:///c:/Dhanush/server/src/routes/healthRoutes.js)
- [NEW] [server/src/controllers/healthController.js](file:///c:/Dhanush/server/src/controllers/healthController.js)
- [NEW] [server/src/server.js](file:///c:/Dhanush/server/src/server.js)

### Frontend Files
- [NEW] [client/package.json](file:///c:/Dhanush/client/package.json)
- [NEW] [client/vite.config.js](file:///c:/Dhanush/client/vite.config.js)
- [NEW] [client/tailwind.config.js](file:///c:/Dhanush/client/tailwind.config.js)
- [NEW] [client/postcss.config.js](file:///c:/Dhanush/client/postcss.config.js)
- [NEW] [client/index.html](file:///c:/Dhanush/client/index.html)
- [NEW] [client/src/index.css](file:///c:/Dhanush/client/src/index.css)
- [NEW] [client/src/main.jsx](file:///c:/Dhanush/client/src/main.jsx)
- [NEW] [client/src/App.jsx](file:///c:/Dhanush/client/src/App.jsx)
- [NEW] [client/src/services/api.js](file:///c:/Dhanush/client/src/services/api.js)

---

## Verification Plan

### Automated / Command Verification
1. `npm install` for both `server` and `client`.
2. Start backend: `node src/server.js` or `npm run dev` and verify port 5000 is listening.
3. Test health API: `curl http://localhost:5000/api/health` -> verify status `success: true` and `database: "connected"`.
4. Start frontend: `npm run dev` in `client/` and verify port 5173 is responding.

### Manual Verification
1. Inspect frontend in browser to confirm the modern UI, Tailwind styling, and real-time backend/MongoDB health badge status.
