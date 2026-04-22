# FocusTrack 🎯

> A full-stack Chrome Extension that tracks browsing time and delivers beautiful productivity analytics.

![Dashboard Preview](https://github.com/Akshta31/Focustrack/blob/f56b87bd821f88f0ab7c21f2bfaf59cb99757b5f/images/dashb1.png)

---

## 📁 Project Structure

```
focustrack/
├── extension/              # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background/
│   │   └── background.js   # Service worker — tab tracking & sync
│   ├── content/
│   │   └── content.js      # SPA navigation detection
│   ├── popup/
│   │   ├── popup.html      # Extension popup UI
│   │   ├── popup.css
│   │   └── popup.js
│   └── icons/              # Extension icons (add your own PNGs)
│
├── client/                 # React.js Dashboard
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── layout/     # Sidebar layout
│       ├── pages/
│       │   ├── DashboardPage.js      # Main analytics view
│       │   ├── WeeklyReportsPage.js  # Weekly charts
│       │   ├── ActivityLogPage.js    # Browsing history
│       │   ├── CategoriesPage.js     # Custom classification rules
│       │   ├── SettingsPage.js
│       │   ├── LoginPage.js
│       │   └── RegisterPage.js
│       ├── store/
│       │   └── AuthContext.js        # Auth state management
│       └── utils/
│           ├── api.js                # Axios instance
│           └── format.js             # Time formatting helpers
│
└── server/                 # Node.js + Express API
    ├── index.js            # Server entry point
    ├── models/
    │   ├── User.js         # User schema
    │   ├── Activity.js     # Browsing activity schema
    │   └── CategoryRule.js # Custom category rules
    ├── routes/
    │   ├── auth.js         # POST /register, POST /login, GET /me
    │   ├── activity.js     # POST /batch, GET /today, GET /range
    │   ├── analytics.js    # GET /dashboard, GET /weekly, GET /categories
    │   └── categories.js   # GET, POST, DELETE /categories
    ├── middleware/
    │   └── auth.js         # JWT protect middleware
    └── utils/
        └── classifier.js   # Domain → category classifier
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Google Chrome

---

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/focustrack.git
cd focustrack

# Install all dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

---

### 2. Configure the Server

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/focustrack
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

> **MongoDB Atlas**: Replace `MONGODB_URI` with your Atlas connection string.

---

### 3. Start the Server

```bash
cd server
npm run dev
# Server runs at http://localhost:5000
```

---

### 4. Start the React Dashboard

```bash
cd client
npm start
# Dashboard opens at http://localhost:3000
```

---

### 5. Load the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `extension/` folder from this project
5. The FocusTrack clock icon will appear in your Chrome toolbar
6. Click it → Sign in with your account → Start tracking!

> **Note:** Add icon files (PNG) to `extension/icons/` — sizes 16, 32, 48, and 128px named `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/update` | Update profile |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/activity/batch` | Bulk-submit activity records |
| GET | `/api/activity/today` | Today's activity |
| GET | `/api/activity/range?start=&end=` | Activity by date range |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Full dashboard data |
| GET | `/api/analytics/weekly?start=` | Weekly breakdown |
| GET | `/api/analytics/categories?start=&end=` | Time by category |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get custom rules |
| POST | `/api/categories` | Add/update a rule |
| DELETE | `/api/categories/:id` | Remove a rule |

---

## ✨ Features

- **Real-time tab tracking** — monitors active tab with idle detection
- **Auto-classification** — 50+ default domain rules (productive/unproductive/neutral)
- **Custom rules** — override classification for any domain
- **Dashboard analytics** — productivity score, time breakdowns, top sites
- **Weekly reports** — bar charts, trend line, pie chart, category grid
- **Activity log** — searchable, filterable browsing history
- **JWT authentication** — secure signup/login flow
- **Background sync** — batches activity every 5 min to the server
- **Export reports** — download weekly summaries

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension UI | HTML, CSS, Vanilla JS |
| Chrome APIs | `tabs`, `storage`, `alarms`, `idle`, `runtime` |
| Dashboard | React 18, React Router, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Security | Helmet, express-rate-limit, CORS |

---

## 📤 Upload to GitHub

### First time setup

```bash
# 1. Initialize git (if not done)
cd focustrack
git init

# 2. Stage all files
git add .

# 3. Initial commit
git commit -m "feat: initial FocusTrack full-stack implementation"

# 4. Create a new repo on GitHub at https://github.com/new
#    Name it: focustrack
#    Leave it empty (no README, no .gitignore)

# 5. Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/focustrack.git
git branch -M main
git push -u origin main
```

### Subsequent pushes

```bash
git add .
git commit -m "your commit message"
git push
```

### Recommended branch strategy

```bash
git checkout -b feature/your-feature
# ... make changes ...
git commit -m "feat: your feature description"
git push -u origin feature/your-feature
# Then open a Pull Request on GitHub
```

---

## 🔒 Security Notes

- Never commit `.env` files — they are in `.gitignore`
- Change `JWT_SECRET` to a strong random string in production
- Use MongoDB Atlas with IP whitelist for production deployments
- The extension only communicates with `localhost:5000` by default — update `API_BASE` in both `background.js` and `popup.js` for production

---

## 🚢 Production Deployment

### Server (e.g. Railway, Render, Fly.io)
```bash
cd server
# Set environment variables in your hosting dashboard
npm start
```

### Client (e.g. Vercel, Netlify)
```bash
cd client
REACT_APP_API_URL=https://your-api.railway.app/api npm run build
# Deploy the build/ folder
```

### Extension for production
- Update `API_BASE` in `extension/background/background.js` and `extension/popup/popup.js` to your production API URL
- Package as `.zip` for Chrome Web Store submission

Dashboard And Weekly Reports:
![Dashboard & Activity](https://github.com/Akshta31/Focustrack/blob/aa8b1dba32c00d83de6865dea6dd7a8d8e3593d4/images/collage.jpeg)
