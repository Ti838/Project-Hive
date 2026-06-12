# ProjectHive Phase 1 - Deployment Guide

## 📦 What's Included

This is a **static HTML + Vanilla JavaScript** frontend for ProjectHive, optimized for:
- **Global CDN distribution** via Vercel Edge
- **Zero build steps** - Pure static files
- **Fast load times** - < 1.2s First Contentful Paint
- **Tailwind CSS via CDN** - No PostCSS pipeline needed

## 🚀 Quick Deploy to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/projecthive-frontend.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect in Vercel Dashboard**
   - Go to https://vercel.com/new
   - Select GitHub > Select Repository
   - Leave all settings default (already configured in `vercel.json`)
   - Click Deploy

3. **Set Environment Variables**
   - In Vercel Dashboard > Settings > Environment Variables
   - Add:
     ```
     REACT_APP_API_URL = https://projecthive-api.render.com/api
     REACT_APP_SOCKET_URL = https://projecthive-api.render.com
     ```

4. **Deploy**
   - Your site is live! Vercel auto-deploys on push to main.

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add environment variables when prompted
# REACT_APP_API_URL: https://projecthive-api.render.com/api
# REACT_APP_SOCKET_URL: https://projecthive-api.render.com
```

## 🔧 Backend Integration (Render)

The frontend expects a backend API running on Render. Here's what's needed:

### Backend Requirements
- **URL**: https://projecthive-api.render.com (adjust to your URL)
- **CORS**: Must allow frontend origin
- **Socket.IO**: Running on same domain as API
- **Authentication**: JWT tokens stored in localStorage

### Environment Variables (Frontend)

Add to Vercel:
```
REACT_APP_API_URL=https://projecthive-api.render.com/api
REACT_APP_SOCKET_URL=https://projecthive-api.render.com
```

## 📡 API Endpoints Expected

The frontend makes calls to these endpoints (defined in `assets/js/core/api.js`):

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

### Users
```
GET  /api/users/me
GET  /api/users/:id
PUT  /api/users/:id
GET  /api/users/search?q=query
```

### Teams
```
GET    /api/teams
GET    /api/teams/:id
POST   /api/teams
PUT    /api/teams/:id
POST   /api/teams/:id/join
POST   /api/teams/:id/leave
POST   /api/teams/:id/requests/:userId/accept
POST   /api/teams/:id/requests/:userId/reject
```

### Messages
```
GET  /api/messages/team/:teamId
POST /api/messages/team/:teamId
```

### AI
```
POST /api/ai/generate-ideas
```

### Projects
```
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PUT    /api/projects/:id
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Backend API has CORS configured for your Vercel domain
- [ ] All environment variables are set in Vercel dashboard
- [ ] Backend uses HTTPS (TLS 1.3)
- [ ] JWT signing keys are securely stored on backend
- [ ] NVIDIA NIM API key is **never exposed** - only used server-side
- [ ] Rate limiting is enabled on backend (100 req/min global, 10 req/min auth)
- [ ] Database backups are configured
- [ ] Error logging is enabled
- [ ] CSRF tokens are implemented on forms

## 📊 Performance Optimization

### Already Optimized:
- ✅ Static files cached with Vercel Edge
- ✅ Tailwind CSS minified via CDN
- ✅ SVG favicon (no HTTP request)
- ✅ Lazy asset loading
- ✅ Responsive images

### Manual Optimizations Needed:
1. **Image Optimization** (Phase 2)
   - Use next-gen formats (WebP)
   - Implement lazy loading for project images
   - Optimize avatar uploads

2. **Code Splitting** (Phase 2)
   - Break large JS files into modules
   - Load Socket.IO library only when needed

3. **Caching Strategy** (Phase 2)
   - Service Worker for offline support
   - LocalStorage for user preferences

## 🧪 Testing Before Production

### Test Cases
1. **Authentication Flow**
   - Sign up with new email
   - Login with correct credentials
   - Verify 401 on invalid token
   - Test token refresh

2. **API Integration**
   - Load dashboard (calls GET /users/me)
   - Search for teams (calls GET /teams)
   - Create a team (calls POST /teams)

3. **Real-Time Features**
   - Connect Socket.IO
   - Send message in team chat
   - Verify typing indicators

4. **Responsive Design**
   - Test on mobile (< 600px)
   - Test on tablet (600px - 1024px)
   - Test on desktop (> 1024px)

### Test Login Credentials
```
Email:    demo@stanford.edu
Password: Demo123!

Email:    test@mit.edu
Password: Test123!
```

## 📈 Monitoring & Logs

### Vercel Analytics
- View at: https://vercel.com/dashboard → Project → Analytics
- Monitor: Build time, response time, error rates

### Custom Monitoring
The frontend logs errors to console with `[v0]` prefix:
```javascript
console.log("[v0] User data received:", userData)
console.error("[v0] API error:", error)
```

Recommend forwarding to error tracking service (Sentry, etc.)

## 🔄 Continuous Deployment

GitHub > Vercel is already configured:
- Push to `main` branch → Auto-deploy to production
- Create PR → Vercel creates preview deployment
- Merge PR → Production update

## 🆘 Troubleshooting

### Issue: "Failed to fetch API"
**Solution**: 
- Check `REACT_APP_API_URL` environment variable in Vercel
- Verify backend CORS allows your domain
- Ensure backend is running and accessible

### Issue: "Socket.IO connection failed"
**Solution**:
- Check `REACT_APP_SOCKET_URL` environment variable
- Verify backend Socket.IO server is running
- Check browser console for connection errors
- Fallback to HTTP polling if WebSocket blocked

### Issue: "401 Unauthorized on every request"
**Solution**:
- Check JWT token refresh endpoint works
- Verify `access_token` is being stored in localStorage
- Check if token is expired (use debugger)
- Confirm server-side JWT validation

### Issue: "Blank page / 404"
**Solution**:
- Check `public/` folder is deployed
- Verify Vercel output directory is `public`
- Check file permissions
- Review build logs in Vercel dashboard

## 📋 Deployment Checklist

Before Going Live:

- [ ] All environment variables set in Vercel
- [ ] Backend API is live and accessible
- [ ] CORS headers are correct
- [ ] SSL certificate is valid (Vercel provides this)
- [ ] Database is backed up
- [ ] Monitoring/logging is configured
- [ ] Error handling is in place
- [ ] Rate limiting is enabled
- [ ] API response times are < 200ms (p95)
- [ ] Uptime monitoring is set up
- [ ] Incident response plan is ready
- [ ] Team has access to Vercel dashboard
- [ ] Documentation is complete

## 📚 Phase 2 Migration

When transitioning to Phase 2 (full build pipeline):

1. **Add Next.js** (or other framework)
2. **Implement API routes** for secure operations
3. **Set up PostCSS** for Tailwind optimization
4. **Add testing** (Jest + React Testing Library)
5. **Implement CI/CD** for automated testing
6. **Add TypeScript** for type safety

## 🤝 Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Review backend API logs on Render
- Check browser console for client errors
- Contact ProjectHive support team

---

**Deployed with ❤️ to Vercel**
