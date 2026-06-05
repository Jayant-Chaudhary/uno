# 🃏 Modern UNO Multiplayer Showdown

An premium, state-of-the-art UNO multiplayer web application. Built with **React**, **Node.js**, **Express**, **Socket.io**, and **PostgreSQL**, this platform delivers a modern real-time experience featuring custom profile builders, robust authentication, database-level concurrency locks, and an elegant glowing dark-theme design.

---

##  Key Features

### 1. Modern Premium Aesthetics & Responsiveness
* **Glassmorphic UI**: Renders sleek cards, menus, and pages with responsive glass panels (`bg-[#333]/20`), micro-animations, high backdrop blur (`backdrop-blur-2xl`), and neon drop shadows.
* **Mobile-Responsive Layouts**: 
  * The **Landing Page** (`Landing.jsx`) and **Auth Pages** (`Auth.jsx`) stack vertically on portrait mobile viewports and display side-by-side on desktop landscape viewports (`flex flex-col lg:flex-row`).
  * The **Gameplay Interface** (`Game.jsx`) adapts seamlessly, transforming bulky sidebars into a compact central HUD on smaller screens, featuring a dynamic **"Current Card"** label inside the discard pile.

### 2. Hardened Gameplay Logic & Turn Passing
* **Pass Turn Security**: Players can only choose to pass their turn if they possess a playable card in their hand but choose not to play it. If they have no playable cards, they are blocked from passing and **must draw a card first**.
* **Dual-Layer Enforcement**:
  * **Frontend UI**: Master action button dynamically switches between "Pass Turn" (active when possessing a playable card) and "Draw Card" (active when no cards are playable).
  * **Backend Sockets**: The server strictly checks playability inside transactional row-locks using the game engine rules (`isValidPlay`). Illegal pass bypasses are instantly rolled back and rejected with a descriptive error.

### 3. Millisecond Turn-Timer Sync & AFK Kick Rules
* **No-Drift In-Memory Timers**: Timers map and schedule turns using the exact database-saved `startedAt` timestamp down to the millisecond. This resolves latency-related desynchronizations that historically caused turns to stick or freeze.
* **Auto-Kick AFK Players**: If a player (connected or disconnected) is inactive for **more than two turns** (kicked on their 3rd consecutive timeout):
  * Their hand is returned to the deck, they are spliced from the game state, and their room status in the database is set to `'left'`.
  * The turn advances normally to the next player.
  * **No Pausing Overlay**: Omits game-blocking overlays or pauses when an opponent disconnects; players are given a 30-second window to return, and are kicked gracefully if they remain AFK.
* **Last Standing Victory**: If player removal drops the active player count to **one (1)**, the remaining player is instantly declared the winner (`game_over`), transitioning the room to a finished state.

### 4. Robust Database Transactions & Concurrency Locks
* **Atomic PostgreSQL Row Locks**: Wrapped all rapid, state-mutating socket handlers (`PlayCards`, `draw_card`, `pass_turn`, `SayUno`, and `CallOut`) inside full database transactions (`BEGIN` and `COMMIT`).
* **Race Condition Prevention**: Handlers issue a `SELECT ... FROM rooms WHERE room_code = $1 FOR UPDATE` query, locking the target room row during processing to guarantee rapid socket events never collide or double-play.

### 5. Social Login & Account Auto-Linking
* **Duplicate Email Auto-Linking**: Enhanced Passport (`passport.js`) OAuth settings. If a user previously signed up via email/password, logging in with Google automatically links their social profile rather than crashing the database with unique key violations.
* **Handle Collision Protection**: Generates unique username handles by checking database availability and appending unique random suffixes on collision.
* **Dynamic Failure Redirects**: Points failed authentications back dynamically to the client's auth portal rather than a raw backend port.

### 6. Standardized Logging & Auto DB Purges
* **Log Purging**: Cleaned up verbose and sensitive console logs (no raw cookies or credential-bearing `DATABASE_URL` leaks).
* **Concise Debug Signals**: Integrated clean, single-line server logs:
  * `[SOCKET]`: Logs concise event receptions and emits (`[SOCKET] Event: play_card from <id>`).
  * `[DECK]`: Logs when a fresh UNO deck is generated.
  * `[GAME_OVER]`: Prints concise match winner details.
  * `[RESET_LINK]`: Prints simple password reset token confirmations.
  * `[ROOM_CLEAR]`: Prints logs when a game finishes or players vacate a room.
  * `[TOKEN_EXPIRY]` / `[SESSION_EXPIRY]`: Logs when password reset tokens or session keys expire.
* **Automatic Database Session Purging**: When processing token refreshes, the server automatically queries and purges all expired sessions from the database (`expires_at <= now()`), logging the output under a `[SESSION_CLEANUP]` line.

---

##  Technology Stack

* **Frontend**: React (Vite, TailwindCSS, custom glassmorphism stylesheets, React-Router-DOM)
* **Backend**: Node.js, Express, Socket.io
* **Database**: PostgreSQL (pg pool connection manager, transactional locks)
* **Authentication**: Passport.js (Google OAuth2.0, Local strategy, JSON Web Tokens)

---

## Setup & Execution

### 1. Prerequisites
Ensure you have the following installed:
* Node.js (v18 or higher)
* PostgreSQL

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Server Config
PORT=5000
CLIENT_API=http://localhost:5173

# Database URL
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>

# Security
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Installation
Install dependencies in the root directory:
```bash
npm install
```

Install dependencies for the frontend client:
```bash
cd client
npm install
cd ..
```

### 4. Running the Application

* **Run Backend Server (with Nodemon dev tracking)**:
  ```bash
  npm run dev
  ```
* **Run Frontend Client (Vite Dev Server)**:
  ```bash
  cd client
  npm run dev
  ```
  Visit the application at `http://localhost:5173`.

---

##  License
This project is licensed under the ISC License.
