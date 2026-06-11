# ProjectHive Phase 1 - Quick Start Guide

## ⚡ 5-Minute Deployment to Vercel

### Step 1: Push to GitHub (2 minutes)

```bash
# Initialize git if not already done
git init
git add .
git commit -m "ProjectHive Phase 1 MVP - Static HTML + Vanilla JS"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/projecthive-frontend.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel (2 minutes)

1. Go to https://vercel.com/new
2. Select **GitHub** → Authorize → Select `projecthive-frontend` repo
3. Click **Deploy** (no config needed - vercel.json included)

### Step 3: Set Environment Variables (1 minute)

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add two variables:

```
REACT_APP_API_URL = https://projecthive-api.render.com/api
REACT_APP_SOCKET_URL = https://projecthive-api.render.com
```

3. Re-deploy from **Deployments** tab

**✅ Your site is now live!** 🎉

---

## 🧪 Test the Frontend (Locally)

### Without Backend (Static Content Only)

```bash
# Python 3
python3 -m http.server 3000 --directory public

# Node.js
npm install -g http-server
http-server public -p 3000

# Mac/Linux
cd public && python -m SimpleHTTPServer 3000
```

Visit http://localhost:3000

### With Backend (Full Integration)

1. Backend running on `http://localhost:5000`
2. Create `.env.local` in project root:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```
3. Restart local server
4. Test login at http://localhost:3000/pages/auth/login.html

---

## 🧑‍💻 Project Structure (60 Seconds)

```
public/
├── index.html              ← Landing page
├── pages/
│   ├── auth/               ← Login/Register
│   ├── dashboard.html      ← Main app
│   ├── profile/            ← Edit profile
│   ├── teams/              ← Team browser
│   ├── projects/           ← AI generator + showcase
│   ├── messages.html       ← Real-time chat
│   ├── notifications.html  ← Notifications
│   └── settings.html       ← Account settings
└── assets/
    ├── css/custom.css      ← All styling
    └── js/core/            ← JS modules
        ├── api.js          ← API wrapper
        ├── auth.js         ← Auth utilities
        ├── socket.js       ← Socket.IO client
        └── store.js        ← State management

Documentation:
├── README.md               ← Overview
├── DEPLOYMENT.md           ← Deploy guide
├── PHASE1_SUMMARY.md       ← Complete feature list
├── PROJECT_STRUCTURE.md    ← File structure
└── QUICKSTART.md           ← This file
```

---

## 🔑 Key URLs

### Frontend Pages
| Page | URL |
|------|-----|
| Landing | `/` |
| Login | `/pages/auth/login.html` |
| Register | `/pages/auth/register.html` |
| Dashboard | `/pages/dashboard.html` |
| Teams | `/pages/teams/index.html` |
| Create Team | `/pages/teams/create.html` |
| Edit Profile | `/pages/profile/edit.html` |
| AI Generator | `/pages/projects/generator.html` |
| Showcase | `/pages/projects/showcase.html` |
| Messages | `/pages/messages.html` |
| Settings | `/pages/settings.html` |

### Test Credentials
```
Email:    demo@stanford.edu
Password: Demo123!
```

---

## 🔗 API Integration

### Expected Backend URL
```
https://projecthive-api.render.com/api
```

### Key Endpoints (Frontend expects these)
```
POST   /auth/register        → { accessToken, refreshToken, user }
POST   /auth/login           → { accessToken, refreshToken, user }
POST   /auth/refresh         → { accessToken, refreshToken }

GET    /users/me             → { user: {...} }
PUT    /users/:id            → { user: {...} }

GET    /teams                → { teams: [...] }
POST   /teams                → { team: {...} }
GET    /teams/:id            → { team: {...} }

GET    /messages/team/:id    → { messages: [...] }
POST   /messages/team/:id    → { message: {...} }

POST   /ai/generate-ideas    → { ideas: [...] }

GET    /projects             → { projects: [...] }
POST   /projects             → { project: {...} }
```

---

## 🐛 Troubleshooting

### "Failed to fetch from API"
```
✓ Check REACT_APP_API_URL in Vercel
✓ Verify backend is running
✓ Check backend CORS allows your domain
```

### "Socket.IO connection failed"
```
✓ Check REACT_APP_SOCKET_URL in Vercel
✓ Verify backend Socket.IO server is running
✓ Check network tab in browser DevTools
```

### "Login not working"
```
✓ Verify backend /auth/login endpoint works
✓ Check token is being stored in localStorage
✓ Check that backend returns { accessToken, refreshToken }
```

### "Can't find page/404 errors"
```
✓ Verify public/ folder was deployed
✓ Check vercel.json output directory is "public"
✓ Ensure file names match URLs exactly
```

---

## 📋 Deployment Checklist

Before declaring complete:

- [ ] Site deployed to Vercel
- [ ] All environment variables set
- [ ] Landing page loads without errors
- [ ] Login/Register pages functional
- [ ] Dashboard displays after login
- [ ] Navigation between pages works
- [ ] No JavaScript console errors
- [ ] Mobile responsive design verified
- [ ] Links to backend API working
- [ ] Documentation reviewed

---

## 🚀 What to Build Next (Phase 2)

1. **Backend API** (Node.js + Express)
   - Authentication system
   - Database integration (MongoDB)
   - Socket.IO server
   - NVIDIA NIM integration

2. **Frontend Improvements**
   - Add Next.js for SSR/SSG
   - TypeScript support
   - Component library
   - Advanced testing

3. **Features**
   - OAuth2 social login
   - Advanced search
   - PWA support
   - Email notifications
   - File uploads

---

## 📞 Support & Resources

### Documentation
- Full README: `/README.md`
- Deployment guide: `/DEPLOYMENT.md`
- Feature summary: `/PHASE1_SUMMARY.md`
- Project structure: `/PROJECT_STRUCTURE.md`

### Links
- Vercel Docs: https://vercel.com/docs
- Tailwind CSS: https://tailwindcss.com
- Socket.IO: https://socket.io/docs/

### Questions?
Check the full documentation files in the project root!

---

## 🎯 Quick Commands

### Local Testing
```bash
python3 -m http.server 3000 --directory public
# Visit http://localhost:3000
```

### Deploy Changes
```bash
git add .
git commit -m "Update description"
git push origin main
# Vercel auto-deploys!
```

### View Logs
```bash
vercel logs [project-name]
```

---

**ProjectHive Phase 1 is ready to ship! 🚀**

*For detailed information, see the documentation files in the project root.*
