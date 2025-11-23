# Deployment Guide: Render + MongoDB Atlas

This guide will walk you through deploying your Pic_studio application to Render (free tier) with MongoDB Atlas as your database.

## Prerequisites

- GitHub account
- MongoDB Atlas account (free)
- Gmail account (for sending emails)
- Your code pushed to a GitHub repository

---

## Part 1: MongoDB Atlas Setup (Database)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Choose the **FREE** tier (M0 Sandbox)

### Step 2: Create a Cluster

1. After logging in, click **"Build a Database"**
2. Choose **FREE** tier (M0)
3. Select a cloud provider and region (choose one closest to you)
4. Name your cluster (e.g., `pic-studio-cluster`)
5. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 3: Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `picstudio-admin` (or your choice)
5. Click **"Autogenerate Secure Password"** - **SAVE THIS PASSWORD!**
6. Database User Privileges: **"Atlas Admin"**
7. Click **"Add User"**

### Step 4: Whitelist IP Addresses

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Render deployment)
   - This adds `0.0.0.0/0` - required for Render's dynamic IPs
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string - it looks like:
   ```
   mongodb+srv://picstudio-admin:<password>@pic-studio-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>`** with the password you saved earlier
7. **Add database name** before the `?`: 
   ```
   mongodb+srv://picstudio-admin:YOUR_PASSWORD@pic-studio-cluster.xxxxx.mongodb.net/Pinterest1?retryWrites=true&w=majority
   ```

**Save this complete connection string - you'll need it for Render!**

---

## Part 2: Gmail App Password Setup (Email Service)

### Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click **"Security"** in the left sidebar
3. Under "How you sign in to Google", enable **"2-Step Verification"**
4. Follow the setup process

### Step 2: Create App Password

1. Still in Security settings, scroll to **"2-Step Verification"**
2. Scroll down to **"App passwords"**
3. Click **"App passwords"**
4. Select app: **"Mail"**
5. Select device: **"Other"** - name it "Pic Studio"
6. Click **"Generate"**
7. **Copy the 16-character password** (no spaces)

**Save this App Password - you'll need it for Render!**

---

## Part 3: Render Deployment

### Step 1: Push Code to GitHub

```bash
# If not already a git repository
git init
git add .
git commit -m "Prepare for Render deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/pic-studio.git
git branch -M main
git push -u origin main
```

### Step 2: Create Render Account

1. Go to [Render](https://render.com/)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### Step 3: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (`pic-studio`)
3. Configure the service:
   - **Name**: `pic-studio` (or your choice)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### Step 4: Add Environment Variables

Scroll down to **"Environment Variables"** and add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string from Part 1 |
| `SESSION_SECRET` | `20c50f73fe66341132de66d8bf570a6c6f835ef251dea9e08598b7f3bef0daee` |
| `EMAIL_USER` | Your Gmail address (e.g., `yourname@gmail.com`) |
| `EMAIL_PASS` | Your Gmail App Password from Part 2 |

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will start building and deploying your app
3. Watch the logs - deployment takes 2-5 minutes
4. Once you see **"Your service is live"**, your app is deployed! 🎉

### Step 6: Access Your App

1. Your app URL will be: `https://pic-studio.onrender.com` (or your chosen name)
2. Click the URL to open your deployed application

---

## Part 4: Testing Your Deployment

### Test Checklist

- [ ] **Homepage loads** - Visit your Render URL
- [ ] **User Registration** - Create a new account
- [ ] **Login** - Sign in with your new account
- [ ] **Upload Image** - Test image upload functionality
- [ ] **Password Reset** - Test "Forgot Password" feature
  - Check your email for the reset link
  - Click the link and reset password
- [ ] **Session Persistence** - Refresh page, verify you stay logged in

---

## Important Notes

### ⚠️ Free Tier Limitations

1. **Cold Starts**: Your app will spin down after 15 minutes of inactivity. First request after inactivity takes ~30 seconds to wake up.

2. **Ephemeral Storage**: Uploaded images are stored temporarily and **will be deleted** when the server restarts. For persistent storage, consider upgrading to Cloudinary (see below).

3. **750 Hours/Month**: Free tier includes 750 hours/month (enough for one app running 24/7).

### 🚀 Optional Upgrades

#### Persistent Image Storage with Cloudinary

If you need uploaded images to persist:

1. Sign up for [Cloudinary](https://cloudinary.com/) (free tier: 25GB storage)
2. Get your API credentials
3. Update `routes/multer.js` to use Cloudinary storage
4. Add Cloudinary credentials to Render environment variables

Let me know if you'd like help setting this up!

#### Custom Domain

1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain and follow DNS instructions

---

## Troubleshooting

### App Won't Start

**Check Render logs:**
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. Look for error messages

**Common issues:**
- Missing environment variables
- MongoDB connection string incorrect
- Port configuration (Render sets `PORT` automatically)

### Database Connection Fails

- Verify MongoDB Atlas connection string is correct
- Check that password in connection string matches your database user password
- Ensure `0.0.0.0/0` is whitelisted in MongoDB Atlas Network Access

### Email Not Sending

- Verify Gmail App Password is correct (16 characters, no spaces)
- Check that 2-Factor Authentication is enabled on your Gmail account
- Ensure `EMAIL_USER` and `EMAIL_PASS` are set in Render environment variables

### Images Not Persisting

This is expected on the free tier. Uploaded images are stored in `/public/images/uploads` which is ephemeral. Consider Cloudinary for persistent storage.

---

## Monitoring Your App

### View Logs
1. Render Dashboard → Your Service → **"Logs"**
2. Real-time logs show all server activity

### Check Metrics
1. Render Dashboard → Your Service → **"Metrics"**
2. View CPU, memory, and bandwidth usage

### Redeploy
1. Push changes to GitHub
2. Render automatically redeploys
3. Or manually redeploy: **"Manual Deploy"** → **"Deploy latest commit"**

---

## Next Steps

✅ Your app is now live and accessible worldwide!

**Recommended actions:**
1. Share your Render URL with friends
2. Test all features thoroughly
3. Monitor logs for any errors
4. Consider setting up Cloudinary for persistent image storage
5. Set up a custom domain (optional)

**Need help?** Check Render's [documentation](https://render.com/docs) or reach out!

---

## Quick Reference

**Your Deployment URLs:**
- **App**: `https://pic-studio.onrender.com` (replace with your actual URL)
- **Render Dashboard**: https://dashboard.render.com/
- **MongoDB Atlas**: https://cloud.mongodb.com/

**Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=20c50f73fe66341132de66d8bf570a6c6f835ef251dea9e08598b7f3bef0daee
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```
