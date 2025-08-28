# 🚀 CodeYap Deployment Guide

## Overview
- **Main App**: Deploy on Vercel
- **Socket Server**: Deploy on Render (separate repository)

---

## 📋 Step-by-Step Deployment

### 1. Create Separate Socket Server Repository

1. **Copy the socket server files** from `socket-server-separate/` folder to a new GitHub repository:
   - `server.js`
   - `package.json` 
   - `README.md`
   - `.env.example`
   - `.gitignore`

2. **Create new GitHub repository** named `codeyap-socket-server`

3. **Push the socket server files** to the new repository

### 2. Deploy Socket Server on Render

1. **Go to Render.com** and create account/login
2. **Create New Web Service**
3. **Connect GitHub repository** (codeyap-socket-server)
4. **Configure service:**
   - **Name**: `codeyap-socket-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     FRONTEND_URL=https://your-app-name.vercel.app
     ```
5. **Deploy** and note the URL (e.g., `https://codeyap-socket-server.onrender.com`)

### 3. Deploy Main App on Vercel

1. **Go to Vercel.com** and create account/login
2. **Import GitHub repository** (this main project)
3. **Add Environment Variables** in Vercel Dashboard:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   NEXTAUTH_SECRET=your-super-secret-jwt-key
   NEXTAUTH_URL=https://your-app-name.vercel.app
   AUTH_GOOGLE_ID=your-google-oauth-client-id
   AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
   GITHUB_CLIENT_ID=your-github-oauth-client-id
   GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   NEXT_PUBLIC_SOCKET_URL=https://codeyap-socket-server.onrender.com
   ```
4. **Deploy**

### 4. Update Socket Server Configuration

After getting your Vercel URL:

1. **Update Render environment variables**:
   - `FRONTEND_URL=https://your-actual-vercel-url.vercel.app`

2. **Redeploy socket server** on Render

---

## 🔧 Environment Variables Reference

### Main App (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `NEXTAUTH_SECRET` | JWT secret key | `your-secret-key` |
| `NEXTAUTH_URL` | Your app URL | `https://app.vercel.app` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | From Google Console |
| `AUTH_GOOGLE_SECRET` | Google OAuth secret | From Google Console |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | From GitHub Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | From GitHub Settings |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | From Cloudinary dashboard |
| `NEXT_PUBLIC_SOCKET_URL` | Socket server URL | `https://socket.onrender.com` |

### Socket Server (Render)
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Your Vercel app URL | `https://app.vercel.app` |

---

## 🎯 Testing Deployment

1. **Check socket server health**: `https://your-socket-server.onrender.com/health`
2. **Test main app**: Visit your Vercel URL
3. **Test real-time features**: 
   - Send messages
   - Check online status
   - Test notifications

---

## 🐛 Troubleshooting

### Common Issues:

1. **Socket connection fails**:
   - Check `NEXT_PUBLIC_SOCKET_URL` is correct
   - Verify socket server is running
   - Check browser console for connection errors

2. **CORS errors**:
   - Ensure `FRONTEND_URL` is set correctly on socket server
   - Check Render logs for CORS issues

3. **Authentication issues**:
   - Verify all OAuth credentials are correct
   - Check `NEXTAUTH_URL` matches your actual domain
   - Ensure `NEXTAUTH_SECRET` is set

### Checking Logs:
- **Vercel**: Go to your deployment → Functions tab → View logs
- **Render**: Go to your service → Logs tab

---

## 📚 Additional Notes

- **Free Tier Limitations**: Render free tier may have cold starts
- **Domain Setup**: You can add custom domains in both Vercel and Render
- **Scaling**: Both platforms offer scaling options for production
- **Monitoring**: Set up monitoring and alerts for production use

---

## 🔄 Future Updates

To update:
1. **Main App**: Push to GitHub → Auto-deploys on Vercel
2. **Socket Server**: Push to socket server repo → Manual redeploy on Render

---

**🎉 Your CodeYap app should now be live and fully functional!**
