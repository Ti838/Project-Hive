# ProjectHive — Quick Start Guide

## 🚀 Start in 3 Steps

**Step 1 — Install**
```bash
cd server
npm install
```

**Step 2 — Configure** (optional but recommended)

Create `server/.env`:
```env
GEMINI_API_KEY=your_key_from_https://aistudio.google.com/apikey
```
> Without this, AI features use a local fallback. Everything else works without any `.env`.

**Step 3 — Run**
```bash
npm start
```
Open: **http://localhost:5000**

---

## 👑 Access Admin Panel

1. Register/Login at `http://localhost:5000`
2. Open browser console (`F12`) and run:
```javascript
fetch('/api/admin/promote-me', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
}).then(r => r.json()).then(d => alert(d.message))
```
3. Logout → Login again
4. Go to: `http://localhost:5000/pages/admin/dashboard.html`

---

## 📄 Pages

| URL | Page |
|-----|------|
| `/` | Landing page |
| `/pages/auth/login.html` | Login |
| `/pages/auth/register.html` | Register |
| `/pages/user/dashboard.html` | Dashboard |
| `/pages/user/profile/edit.html` | Edit Profile |
| `/pages/user/settings.html` | Settings |
| `/pages/user/people.html` | Find People |
| `/pages/user/notifications.html` | Notifications |
| `/pages/user/messages.html` | Messages |
| `/pages/user/teams.html` | Find Teams |
| `/pages/user/projects/showcase.html` | Project Showcase |
| `/pages/user/projects/generator.html` | AI Generator |
| `/pages/admin/dashboard.html` | Admin Panel |

---

## 🌙 Theme

Click the 🌙 toggle in the sidebar to switch Dark/Light mode. Preference is saved to localStorage.

To change accent color → Settings → Appearance → Accent Color.
