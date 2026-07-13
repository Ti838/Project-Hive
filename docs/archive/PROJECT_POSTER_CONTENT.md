# ProjectHive - Comprehensive System Overview
*This document contains the features and technical stack details to be used for your poster/presentation.*

## 🚀 What is ProjectHive?
ProjectHive is a premium, centralized collaboration platform designed for students and developers. It serves as a social network, workspace, and communication hub where individuals can find teammates, showcase projects, and communicate seamlessly using real-time chat, voice, and video calls.

---

## 🛠️ Technology Stack
**Frontend (Client-Side)**
- **Core:** HTML5, Vanilla JavaScript (ES6+), modern DOM manipulation.
- **Styling:** Custom CSS Design System (`ph-design.css`, `ph-system.css`) with Mobile-First Responsive methodologies. Native CSS variables for light/dark mode.
- **Real-time & Media:** Socket.io-client, WebRTC (Simple-peer) for A/V calls.
- **UI/UX Patterns:** Glassmorphism, premium micro-animations, bottom-sheet navigation for mobile, floating action buttons (FAB).

**Backend (Server-Side)**
- **Core:** Node.js, Express.js
- **Authentication:** Supabase Auth (JWT), Google OAuth 2.0
- **Real-time Server:** Socket.io
- **AI Integration:** Google Gemini API (Generative AI)

**Database & Storage**
- **Primary Database:** Supabase (PostgreSQL) - *Migrated from MongoDB for better relational mapping and scaling.*
- **Storage:** Cloudinary / Local base64 processing (for profile cropping, banners, and feed images).

---

## 🔥 Key Features & Capabilities

### 1. Advanced Authentication & Security
- **Multi-method Login:** Standard Email/Password registration along with seamless Google OAuth integration.
- **Email Verification:** Mandatory email verification flows ensuring authentic user bases.
- **Session Management:** Secure JWT-based session persistence across tabs and reloads.

### 2. Social Feed & Networking
- **Interactive Feed:** Users can create posts, share achievements, and upload images.
- **Mentions & Tagging:** Dynamic `@mention` system to tag teammates in posts.
- **Global Search (Ctrl+K):** A premium command-palette search interface to instantly find Users, Teams, and Projects across the platform.

### 3. Real-Time Communication (Text, Voice & Video)
- **Live Chat:** Instant 1-on-1 messaging with real-time delivery, typing indicators, and unread message badges.
- **WebRTC A/V Calling:** High-quality, peer-to-peer Voice and Video calling directly in the browser. Features include ringtones, incoming call modals, and call duration tracking.
- **Real-time Notifications:** Instant alerts for friend requests, mentions, and team activities.

### 4. Team Building & Collaboration (Find Teams)
- **Team Discovery:** Browse and discover open teams filtering by categories (Web Dev, AI/ML, Design, etc.).
- **Access Control:** Send join requests, and allow team leaders to accept, decline, or kick members.
- **Team Roles:** Strict Leader and Member permission handling.

### 5. Profile & Customization
- **Rich Profiles:** Users can add their University, Major, Bio, and Skills.
- **Advanced Image Cropping:** Custom-built "Contain" logic for uploading and precisely cropping Profile Avatars and Cover Banners without stretching or cutting off content.
- **Dark/Light Mode:** Full system-aware and manual theme toggling.

### 6. Built-in AI Assistant (Gemini)
- **Global AI Popup:** A floating AI assistant accessible from any page via the bottom navigation bar or floating button.
- **Smart Generation:** Powered by Google Gemini, the AI can help users brainstorm project ideas, write code snippets, and assist with platform navigation.

### 7. Premium Mobile-First Experience
- **App-like Feel:** Mobile users get a native-app experience with a custom bottom navigation bar, swipeable sheets, and touch-optimized components.
- **Adaptive UI:** Complex desktop interfaces (like the chat workspace) automatically transform into off-canvas drawers and full-screen layouts on small screens.

---

## 📈 System Architecture Highlights
- **No-Refresh Navigation:** Pre-fetching strategies (`link rel="prefetch"`) combined with intelligent caching (`localStorage`) provide near-instant page loads.
- **Backend Keep-Alive:** Automated ping mechanisms to prevent server cold-starts, ensuring the platform is always ready.
- **Custom Modals:** Fully custom-built dialogs and lightboxes replace ugly native browser `alert()` and `confirm()` prompts, ensuring 100% brand consistency.
