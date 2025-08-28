# 🚀 CodeYap

> **Real-time collaborative coding and communication platform for developers**

A modern, feature-rich messaging and code collaboration platform that brings developers together. Built with Next.js 15, React 19, and Socket.IO for seamless real-time communication.

![CodeYap Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-green?logo=socket.io)

---

## ✨ **Key Features**

### 💬 **Smart Messaging System**
- **Real-time chat** with instant message delivery and optimistic UI updates
- **Group conversations** with seamless member management
- **Unread indicators** with smart notification badges and visual highlights
- **Message previews** in chat lists with automatic text truncation
- **File sharing** with image upload support and "File uploaded" previews
- **Typing indicators** for both private and group chats

### 👥 **Advanced User Management**
- **User discovery** with intelligent search functionality
- **Connection system** with friend request notifications
- **Profile management** with customizable user profiles and avatars
- **Online presence** tracking with real-time status updates
- **Last seen** timestamps for offline users

### 🏗️ **Group Collaboration**
- **Create groups** with custom names and member invitations
- **Group administration** with admin controls and member management
- **Join/leave groups** with real-time updates across all members
- **Group notifications** for invites, joins, and administrative actions
- **Real-time group chat** with synchronized message delivery

### 🔔 **Intelligent Notifications**
- **Real-time notifications** for messages, invites, and group activities
- **Interactive notifications** with accept/reject functionality
- **Notification management** with mark as read and bulk actions
- **Smart prioritization** with unread status tracking

### 💻 **Developer-Focused Features**
- **Code editor integration** with Monaco Editor support
- **Syntax highlighting** for multiple programming languages
- **GitHub integration** for repository access and file sharing
- **OAuth authentication** with seamless GitHub login
- **File tree navigation** for shared repositories

### 🎨 **Modern User Experience**
- **Dark theme** with carefully crafted UI/UX design
- **Responsive design** that works across all devices
- **Smooth animations** with React Spring integration
- **Instant feedback** with optimistic UI updates
- **Loading states** and skeleton screens for better UX

### 🔐 **Security & Authentication**
- **NextAuth.js integration** with secure session management
- **JWT tokens** for API authentication
- **Password encryption** with bcrypt
- **CORS protection** for secure cross-origin requests
- **Input validation** and sanitization

### ⚡ **Performance & Scalability**
- **Real-time updates** powered by Socket.IO
- **Optimized database queries** with MongoDB and Mongoose
- **Image optimization** with Cloudinary integration
- **Efficient state management** with React hooks and context
- **Production-ready deployment** on Vercel and Render

---

## 🎯 **What Makes CodeYap Special**

### 🔄 **Real-Time Everything**
Experience true real-time collaboration with instant message delivery, live typing indicators, and synchronized presence updates. No more refreshing pages or waiting for updates.

### 🎪 **Smart Chat Lists**
Chat lists that actually work - messages move to the top, unread indicators are accurate, and new conversations appear instantly when you accept invitations.

### 🤝 **Seamless Collaboration**
Whether it's a quick code review or a long brainstorming session, CodeYap's group features make team collaboration feel natural and effortless.

### 📱 **Mobile-First Design**
Built with responsiveness in mind, CodeYap works beautifully on everything from mobile phones to ultrawide monitors.

### 🔧 **Developer Experience**
From the Monaco code editor to GitHub integration, every feature is designed with developers in mind. Share code, review together, and stay connected with your team.

---

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **React Spring** - Smooth animations

### **Backend**
- **Next.js API Routes** - Server-side logic
- **MongoDB** - Document database
- **Mongoose** - ODM for MongoDB
- **NextAuth.js** - Authentication system
- **Socket.IO** - Real-time communication
- **Cloudinary** - Image management

### **Real-Time Infrastructure**
- **Socket.IO Server** - WebSocket management
- **Real-time presence** - Online/offline tracking
- **Event-driven architecture** - Scalable messaging system

---

## 🚀 **Getting Started**

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/HarshGeed/CodeYap.git
cd CodeYap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev

# Start socket server (in another terminal)
node socket-server.js
```

### **Environment Setup**
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your-mongodb-connection-string
GITHUB_CLIENT_ID=your-github-oauth-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 📸 **Features in Action**

### **Real-Time Messaging**
- Messages appear instantly with optimistic UI
- Enter key sends messages on first press
- File uploads with progress indicators
- Typing indicators for better communication flow

### **Smart Notifications**
- Accept friend requests directly from notifications
- Join groups with one click
- Real-time chat list updates when accepting invites
- Unread badges that actually work

### **Group Management**
- Create groups and invite members
- Real-time member list updates
- Admin controls for group management
- Seamless join/leave functionality

### **Developer Tools**
- Integrated code editor with syntax highlighting
- GitHub repository integration
- File sharing with preview support
- OAuth authentication with GitHub

---

## 🌟 **Why Choose CodeYap?**

✅ **Production Ready** - Deployed and tested in real-world scenarios  
✅ **Modern Architecture** - Built with the latest React and Next.js features  
✅ **Real-Time First** - Everything updates instantly, no page refreshes needed  
✅ **Developer Focused** - Features built specifically for development teams  
✅ **Scalable Design** - Architecture that grows with your team  
✅ **Beautiful UI** - Thoughtfully designed interface that's a joy to use  

---

## 📋 **Roadmap**

- [ ] **Voice/Video Calls** - Integrated calling within chat rooms
- [ ] **Screen Sharing** - Share your screen during conversations
- [ ] **Code Collaboration** - Real-time collaborative code editing
- [ ] **Project Management** - Built-in task and project tracking
- [ ] **Mobile App** - Native mobile applications for iOS and Android
- [ ] **Themes** - Multiple theme options and customization
- [ ] **Plugins** - Extensible plugin system for custom features

---

## 🤝 **Contributing**

We welcome contributions! Whether it's bug fixes, feature additions, or documentation improvements, every contribution makes CodeYap better.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Author**

**Harsh Geed**
- GitHub: [@HarshGeed](https://github.com/HarshGeed)
- Project: [CodeYap](https://github.com/HarshGeed/CodeYap)

---

<div align="center">

**Built with ❤️ for the developer community**

[⭐ Star this repo](https://github.com/HarshGeed/CodeYap) • [🐛 Report Bug](https://github.com/HarshGeed/CodeYap/issues) • [💡 Request Feature](https://github.com/HarshGeed/CodeYap/issues)

</div>
