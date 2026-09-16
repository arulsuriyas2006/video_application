# VideoFlow — Local-First Video Collaboration & Review SaaS Platform

<div align="center">
  <h3>Professional, frame-accurate video collaboration, canvas drawing, voice feedback, version comparison, and client sign-off approvals.</h3>
  <p><strong>100% Local-First • Zero Paid Cloud Dependencies • Frame.io & Postjamm Alternative</strong></p>
</div>

---

## 🌟 Overview

**VideoFlow** is a modern, full-stack video collaboration and review platform tailored for video production agencies, post-production houses, freelance video editors, and clients.

Unlike existing enterprise solutions that lock assets behind costly cloud storage subscriptions (AWS S3, Cloudinary, Frame.io), VideoFlow is engineered to run **100% locally on your own workstation or private infrastructure** with:
- **Local FFmpeg & FFprobe media pipelines** for automatic resolution extraction, duration calculation, and frame-accurate timeline indexing.
- **Local file persistence** for video footage, thumbnails, and browser-recorded voice notes.
- **Real-Time WebSocket collaboration** via Socket.IO for live collaborator presence, instant comments, synchronized drawing strokes, and co-watching.
- **Tokenized public client review portals** with optional passcode protection and formal cut sign-offs (**Approve Cut** / **Request Changes**).

---

## 🛠️ Technology Stack

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript, Tailwind CSS | High-performance SPA with custom glassmorphic dark theme |
| **Icons & UI** | Lucide React | Clean, modern visual language |
| **Media Player** | HTML5 Video API, Custom Scrubber | Frame-stepping (`-1f`/`+1f` at 1/30s precision), speed controls (`0.5x` to `2x`) |
| **Canvas** | HTML5 Canvas 2D Context | Resolution-independent, normalized (0.0–1.0) vector drawing overlay |
| **Audio** | Web MediaRecorder API | Direct in-browser microphone capture & waveform player |
| **Real-Time** | Socket.IO Client | Real-time presence, collaborator avatars, live comment sync |
| **Backend** | Node.js, Express.js | Robust REST API with modular routers and controllers |
| **Database** | MongoDB & Mongoose | Document database with compound indexing |
| **Security** | JWT, HTTP-only cookies, bcryptjs, Helmet | Strict RBAC (`ADMIN`, `EDITOR`, `CLIENT`) |
| **Media Engine** | `@ffmpeg-installer/ffmpeg`, `fluent-ffmpeg` | Local binary media analysis and thumbnail generation |
| **File Storage** | Multer | Local multi-part storage (`server/uploads/`) |

---

## 🏗️ Architecture & Workspaces

```text
videoflow/
├── client/                               # Frontend Single-Page Application (Vite)
│   ├── src/
│   │   ├── components/                   # Reusable UI & Video components
│   │   │   ├── video/
│   │   │   │   ├── CustomVideoPlayer.jsx # Master video player with frame markers
│   │   │   │   ├── CommentPanel.jsx      # Feedback sidebar with filters & voice chips
│   │   │   │   ├── AnnotationCanvas.jsx  # Interactive vector drawing overlay
│   │   │   │   ├── AnnotationToolbar.jsx # Drawing tools (Arrow, Rect, Freehand)
│   │   │   │   ├── VoiceRecorder.jsx     # In-browser audio note recorder
│   │   │   │   ├── VoiceNotePlayer.jsx   # Soundwave player with scrubber
│   │   │   │   └── ShareReviewModal.jsx  # Tokenized link generator & manager
│   │   │   ├── Navbar.jsx                # Global navigation & user profile
│   │   │   ├── ProtectedRoute.jsx        # RBAC route guard
│   │   │   └── StatusBadge.jsx           # Cut & Project status badges
│   │   ├── context/
│   │   │   ├── AuthContext.jsx           # User authentication & session state
│   │   │   └── SocketContext.jsx         # Real-time WebSocket connection & presence
│   │   ├── pages/
│   │   │   ├── Login.jsx & Register.jsx  # User authentication
│   │   │   ├── Dashboard.jsx             # Metrics, recent projects & activity feed
│   │   │   ├── Clients.jsx               # Client CRM (Admin only)
│   │   │   ├── Projects.jsx              # Project list & filtering
│   │   │   ├── ProjectDetail.jsx         # Creative brief, video cuts, activity log
│   │   │   ├── VideoReview.jsx           # Main review suite with active presence
│   │   │   ├── VersionCompare.jsx        # Dual-player comparison workspace
│   │   │   ├── PublicReview.jsx          # Client-facing tokenized review portal
│   │   │   └── Health.jsx                # Diagnostic status dashboard
│   │   ├── App.jsx                       # Routing tree
│   │   └── main.jsx
│   └── package.json
│
├── server/                               # Backend API & WebSocket Server
│   ├── src/
│   │   ├── config/                       # MongoDB connection & environment
│   │   ├── controllers/                  # Route business logic
│   │   │   ├── authController.js         # JWT login, register, profile
│   │   │   ├── clientController.js       # Client CRM handlers
│   │   │   ├── projectController.js      # Project management & activity logging
│   │   │   ├── videoController.js        # Video upload, processing & cuts
│   │   │   ├── commentController.js      # Feedback, replies, resolve toggles
│   │   │   ├── annotationController.js   # Canvas shape persistence
│   │   │   ├── versionController.js      # Video cut comparison & metrics
│   │   │   └── reviewLinkController.js   # Tokenized share links & client sign-offs
│   │   ├── middleware/                   # Auth guards, upload engines, error handlers
│   │   ├── models/                       # Mongoose schemas (8 collections)
│   │   ├── routes/                       # Express REST routes
│   │   ├── scripts/
│   │   │   └── seed.js                   # Comprehensive database seeder
│   │   └── server.js                     # HTTP & Socket.IO server entry point
│   ├── uploads/                          # Local Media Storage
│   │   ├── audio/                        # Recorded voice feedback (.webm)
│   │   ├── thumbnails/                   # Generated video poster frames (.jpg)
│   │   └── videos/                       # Original uploaded video cuts (.mp4/.mov)
│   ├── test_*.js                         # Automated phase test suites (Phases 1-11)
│   ├── test_e2e_full.js                  # Master end-to-end test suite
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js**: v18 or higher (tested on Node v20/v24).
2. **MongoDB**: Local MongoDB community instance running on port `27017`.

### 1. Start Local MongoDB
```bash
# Example Windows command
mongod --dbpath "c:\Dhanush\mongodb_data" --bind_ip 127.0.0.1 --port 27017
```

### 2. Setup & Seed Backend
```bash
cd server
npm install
npm run seed     # Populates users, projects, cuts, comments, canvas annotations & review links
npm run dev      # Starts Express & Socket.IO on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd ../client
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

---

## 🔑 Demo Accounts & Test Credentials

The database seeder (`npm run seed`) initializes three accounts representing the core creative workflow:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@videoflow.local` | `AdminPass123!` | Full system access, client CRM, project creation, delete rights |
| **🎬 Editor** | `editor@videoflow.local` | `EditorPass123!` | Upload new video revisions, reply to feedback, resolve comments |
| **💼 Client** | `client@videoflow.local` | `ClientPass123!` | Review assigned projects, add timestamped feedback, approve cuts |

---

## 🎯 Key Feature Workflows

### 1. Frame-Accurate Video Review & Player
- Navigate to **Projects** &rarr; select **Nike Summer Campaign - 60s Hero** &rarr; click **Review** on cut **V2**.
- Custom scrub bar with embedded colored markers indicating comment locations.
- Single-frame stepping via `-1f` and `+1f` buttons (1/30 second precision).
- Variable playback speeds: `0.5x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`.

### 2. Visual Canvas Annotations
- Click **Draw** on the video player or inside the comment composer.
- Choose between **Arrow**, **Rectangle**, or **Free Draw** pen.
- Select color palettes (Red, Amber, Emerald, Cyan, Violet).
- Drawings scale dynamically across any resolution or screen aspect ratio using normalized `0.0–1.0` coordinate geometry.
- Clicking any comment in the sidebar automatically seeks the video and reveals the saved annotation overlay on the frame.

### 3. Voice Feedback Notes
- Click the **Voice** button in the feedback panel.
- Record voice notes up to 2 minutes with live soundwave visualization.
- Listen back using the built-in preview player, then attach directly to the current video frame.
- Audio is saved locally to `server/uploads/audio/` and streamed over HTTP with byte-range support.
- Comments with audio display interactive waveform players with custom scrubbers and speed toggles.

### 4. Version Comparison Workspace
- Compare multiple iterations of a cut side-by-side or overlaid.
- URL: `/compare/:projectId/:v1Id/:v2Id` (or click **Compare Cuts** in the review header).
- **Three Viewing Modes**:
  1. **Side-by-Side**: Two synchronized responsive players.
  2. **Wipe Slider**: Draggable vertical split divider (`↔`) revealing V1 on the left and V2 on the right.
  3. **A/B Flip**: Instant single-button toggle between cuts at the exact same playback frame.
- Master timeline controller keeps both video streams synchronized in real time.
- Diff drawer highlights duration delta, file size delta, and comment counts.

### 5. Real-Time Collaboration & Room Presence
- Open two browser windows (e.g. Normal window as Admin, Incognito window as Editor).
- Both users navigating to the same cut will immediately see each other in the **Active Reviewers** pill (`2 Online`).
- Comments, replies, and status resolutions appear instantaneously across all connected screens via Socket.IO without page reloads.

### 6. Secure Client Review Links & Approvals
- In the review header, click **Share Link**.
- Configure optional security passcodes and expiration periods.
- External clients can open the link in any browser (no login required!):
  - Pre-seeded test link: `http://localhost:5173/review/share/nike-hero-cut-review-2026`
  - Passcode: `Client2026!`
- Clients can watch the cut, post guest feedback, and submit formal sign-offs:
  - **"Approve Cut"**: Confirms cut approval and automatically updates the video status to `APPROVED`.
  - **"Request Changes"**: Submits revision instructions directly to the editing team.

---

## 🧪 Comprehensive Automated Test Suites

Run any of the standalone test scripts in `server/` to verify specific phases or execute the master end-to-end suite:

```bash
cd server

# Master End-to-End Test (All 11 Phases)
node test_e2e_full.js

# Phase-Specific Integration Tests
node test_phase6.js    # Comments & Replies
node test_phase7.js    # Canvas Annotations
node test_phase8.js    # Voice Notes & Audio Streaming
node test_phase9.js    # Video Version Comparison API
node test_phase10.js   # Real-Time WebSocket Presence
node test_phase11.js   # Client Review Links & Sign-Offs
```

---

## 📡 REST API Reference Summary

### Authentication & Users
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Authenticate and receive HTTP-only JWT
- `POST /api/auth/logout` — Clear session
- `GET /api/auth/me` — Current authenticated user profile

### Projects & Clients
- `GET /api/clients` — List all clients (Admin)
- `POST /api/clients` — Create client (Admin)
- `GET /api/projects` — List accessible projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Project details with populated client and editor
- `PUT /api/projects/:id` — Update project metadata / status
- `GET /api/projects/:id/activities` — Full activity audit trail

### Videos & Versions
- `POST /api/videos/upload` — Upload video cut (Multer + FFmpeg processing)
- `GET /api/videos/:id` — Video metadata & file stream path
- `GET /api/projects/:projectId/versions` — All versions indexed for a project
- `GET /api/projects/:projectId/compare?v1=:id&v2=:id` — Version comparison diff metrics

### Comments, Annotations & Voice Notes
- `GET /api/videos/:videoId/comments` — Frame-sorted comments with replies
- `POST /api/videos/:videoId/comments` — Add timestamped comment with optional voice note & annotations
- `POST /api/comments/:id/replies` — Add threaded reply
- `PATCH /api/comments/:id/resolve` — Toggle resolved / open status
- `DELETE /api/comments/:id` — Cascade delete comment, audio file & annotations
- `GET /api/videos/:videoId/annotations` — Canvas annotation vector shapes

### Public Client Review Links & Sign-Offs
- `POST /api/review-links/videos/:videoId` — Generate tokenized client review link
- `GET /api/review-links/videos/:videoId` — List active review links for cut
- `DELETE /api/review-links/:id` — Revoke review link
- `GET /api/review-links/public/:token` — Fetch public review session (validates passcode/expiry)
- `POST /api/review-links/public/:token/verify` — Verify passcode and issue session token
- `POST /api/review-links/public/:token/comments` — Post guest feedback comment
- `POST /api/review-links/public/:token/decision` — Submit formal cut sign-off (`APPROVE` or `REQUEST_CHANGES`)

---

## 🔒 Security & Privacy

- **Zero Cloud Leakage**: Video footage and audio recordings never leave your local environment.
- **Role-Based Access Control**: Strict middleware verification for `ADMIN`, `EDITOR`, and `CLIENT` roles.
- **Passcode Hashing**: Client review link passcodes are hashed using `bcrypt` with salt rounds.
- **HTTP-Only Cookies & JWTs**: Defense against XSS token extraction.
- **Byte-Range Audio/Video Streaming**: Media files stream locally with `Accept-Ranges: bytes` support for instant scrubbing without full file preloading.

---

<div align="center">
  <p>Crafted with ❤️ for creators, video editors, and creative agencies.</p>
</div>
