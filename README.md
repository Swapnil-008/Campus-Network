# CampusNet

CampusNet is a full-stack college collaboration platform for announcements, placements, real-time chat, and role-based administration.

It brings students, teachers, TnP admins, and college admins into one system with secure APIs (JWT) and live communication (Socket.IO).

## Features

- Role-based access for `student`, `teacher`, `tnp_admin`, `college_admin`
- JWT-protected APIs with middleware authorization
- Announcement module with priority, visibility, and read tracking
- Placement/TnP module with eligibility filtering and application tracking
- Real-time group and direct messaging via Socket.IO
- Typing indicators, read receipts, delivery events, reactions, message edits
- Notifications module for user-targeted alerts
- File upload support with image optimization (`multer` + `sharp`)
- Admin panel for approvals, user management, and platform stats

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Socket.IO Client
- Tailwind CSS

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- JWT (`jsonwebtoken`)
- `bcryptjs`, `helmet`, `cors`, `express-rate-limit`, `express-validator`
- `multer` + `sharp`

## Project Structure

```text
CampusNet/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    socket/
    server.js
    package.json
  frontend/
    public/
    src/
      components/
      context/
      hooks/
      pages/
      services/
      utils/
    package.json
  README.md
```

## Architecture Overview

- Frontend (`React`) calls backend REST APIs through a centralized Axios service.
- Frontend stores JWT in `localStorage` and sends it in `x-auth-token` header.
- Backend middleware verifies token and attaches `req.user` for protected routes.
- Socket.IO establishes an authenticated live connection for real-time chat updates.
- MongoDB stores users, announcements, companies, groups, messages, conversations, and notifications.

## Core Entities

- `User`: profile, role, department/year/cgpa, approval/verification
- `Announcement`: title/content/priority/visibility/readBy
- `Company`: role/package/eligibility/deadline/applications
- `Group`: members/admins/settings/pending requests
- `Message`: direct/group message, file/reply/reactions/read state
- `Conversation`: DM participants, lastMessage, unread count
- `Notification`: per-user alerts for system and content events

## Roles and Permissions

- `student`: view announcements, apply to companies, chat, manage own profile
- `teacher`: post announcements, interact in groups/chat
- `tnp_admin`: manage placement opportunities and related flows
- `college_admin`: user approvals, role changes, user deletion, platform stats

## API Modules

Base URL:

- Backend local: `http://localhost:5000/api`

### Auth (`/api/auth`)

- `POST /register`
- `POST /login`
- `GET /me`
- `PUT /profile`
- `PUT /profile-picture`
- `PUT /change-password`
- `GET /verify-email/:token`
- `GET /applications`

### Announcements (`/api/announcements`)

- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id/read`
- `PUT /:id`
- `DELETE /:id`

### Companies (`/api/companies`)

- `POST /`
- `GET /`
- `GET /:id`
- `POST /:id/apply`
- `PUT /:id`
- `DELETE /:id`
- `GET /:id/export`
- `POST /close-expired`

### Groups (`/api/groups`)

- `POST /`
- `GET /my-groups`
- `GET /search`
- `GET /:id`
- `POST /:id/join`
- `POST /:id/leave`
- `POST /:id/approve`
- `POST /:id/remove-member`
- `POST /:id/make-admin`
- `POST /:id/remove-admin`
- `PUT /:id/settings`
- `DELETE /:id`

### Messages (`/api/messages`)

- `GET /users/search`
- `GET /search`
- `GET /group/:groupId`
- `GET /direct/:userId`
- `GET /conversations`
- `POST /mark-read`
- `DELETE /:id`

### Notifications (`/api/notifications`)

- `GET /`
- `PUT /:id/read`
- `PUT /read-all/all`
- `DELETE /:id`

### Admin (`/api/admin`)

- `GET /users`
- `PUT /users/:id/approve`
- `DELETE /users/:id`
- `PUT /users/:id/role`
- `GET /statistics`

### Upload (`/api/upload`)

- `POST /`
- `POST /multiple`
- `DELETE /:filename`

## Real-Time Chat (Socket.IO)

Socket connection is created after login. The JWT is sent in handshake auth and validated on the server.

### Connection Flow

1. Frontend opens socket using token.
2. Backend verifies token.
3. User is added to:
   - personal room: `user:{userId}`
   - group rooms: `group:{groupId}` for groups they belong to
   - direct conversation room when opened: `conversation:{id}`

### Key Socket Events

- Group:
  - `group:join`, `group:leave`
  - `group:message`
  - `group:typing`, `group:stop-typing`
- Direct:
  - `direct:join`, `direct:leave`
  - `direct:message`
  - `direct:typing`, `direct:stop-typing`
- Status:
  - `messages:read`
  - `message:react`
  - `message:edit`
  - `user:online`, `user:offline`, `users:online-list`

### Why Messages Appear Instantly

Socket.IO keeps a persistent connection, so the server pushes events immediately to connected clients in relevant rooms. React updates state and re-renders without page refresh.

## Environment Variables

Create a `.env` file in `backend/`.

Required:

```env
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

Optional in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB instance (local or cloud)

### 1) Clone

```bash
git clone <your-repo-url>
cd CampusNet
```

### 2) Install Dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 3) Configure Environment

- Add `backend/.env` values (required)
- Optionally add `frontend/.env`

### 4) Run Development Servers

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## Build and Production

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

Backend:

```bash
cd backend
npm start
```

## Security and Validation

- JWT-based protected routes via `auth.middleware.js`
- Input validation using `express-validator`
- Password hashing with `bcryptjs`
- `helmet` for secure HTTP headers
- CORS controlled by `CLIENT_URL`
- Rate limits:
  - Auth routes: 20 requests / 15 minutes
  - General API: 200 requests / 15 minutes
- Upload size limit: 10 MB

## Current Limitations / Notes

- No automated test suite is configured yet.
- Current token flow uses access token in header; refresh-token flow is not yet integrated.
- Email verification token is generated; delivery setup should be confirmed before production.

## License

ISC (as defined in backend `package.json`).

## Author

CampusNet project contributors.
