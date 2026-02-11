# MongoDB Atlas Setup Guide for WorkHub Solutions

## ✅ Your MongoDB Atlas Connection

**Connection String:**
```
mongodb+srv://ironman_db_user:Bhavesh%405757@cluster0.pd0dyud.mongodb.net/workhub_admin?retryWrites=true&w=majority&appName=Cluster0
```

**Database Name:** `workhub_admin`

---

## 🔐 Important Security Steps

### 1. **Whitelist Your IP Address**

Your current setup might need IP whitelisting:

1. Go to MongoDB Atlas Dashboard
2. Click on "Network Access" in left sidebar
3. Click "Add IP Address"
4. Choose one:
   - **Allow from Anywhere:** `0.0.0.0/0` (Development only)
   - **Add Current IP:** Your specific IP address (Recommended)

### 2. **Database User Permissions**

Your user `ironman_db_user` should have:
- ✅ Read and write to database
- ✅ Atlas admin (if needed)

Check in: **Database Access** → **ironman_db_user** → **Edit**

---

## 🚀 Quick Start Commands

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Verify .env File
Make sure your `.env` has:
```env
MONGODB_URI=mongodb+srv://ironman_db_user:Bhavesh%405757@cluster0.pd0dyud.mongodb.net/workhub_admin?retryWrites=true&w=majority&appName=Cluster0
```

### 3. Test Connection
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully
📦 Database: workhub_admin
🌐 Host: cluster0-shard-00-00.pd0dyud.mongodb.net
```

### 4. Seed Database (First Time Only)
```bash
npm run seed
```

This creates:
- ✅ Admin user (admin@workhub.com / Admin@123)
- ✅ 3 Sample users
- ✅ 5 Sample employees
- ✅ 4 Sample inquiries
- ✅ 5 Sample services

---

## 🔍 Verify Data in MongoDB Atlas

1. Go to MongoDB Atlas Dashboard
2. Click "Browse Collections"
3. Select database: `workhub_admin`
4. You should see collections:
   - users
   - employees
   - inquiries
   - services

---

## 🐛 Troubleshooting

### Error: "Authentication failed"
**Solution:** Check username and password in connection string

### Error: "Could not connect to any servers"
**Solutions:**
1. Check internet connection
2. Verify IP is whitelisted in Network Access
3. Check if cluster is paused (free tier auto-pauses)

### Error: "Timeout"
**Solutions:**
1. Whitelist IP: 0.0.0.0/0 for testing
2. Check firewall settings
3. Try different network

### Error: "MongoServerError: bad auth"
**Solution:** Reset password in MongoDB Atlas:
1. Database Access → ironman_db_user → Edit
2. Change password
3. Update in .env file

---

## 📊 Monitor Your Database

### Check Connection Status:
```bash
curl http://localhost:5000/health
```

### View Logs:
Backend logs show connection status and errors

### MongoDB Atlas Dashboard:
- View real-time metrics
- Check query performance
- Monitor storage usage

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random string
- [ ] Restrict IP whitelist (remove 0.0.0.0/0)
- [ ] Enable MongoDB backup
- [ ] Set up monitoring alerts
- [ ] Review user permissions
- [ ] Change default admin password
- [ ] Enable SSL/TLS
- [ ] Set up environment variables properly

---

## 💡 Tips

1. **Free Tier Limits:**
   - 512 MB storage
   - Shared RAM
   - No backups
   - Cluster pauses after 60 days inactivity

2. **Database Name:** 
   - Current: `workhub_admin`
   - Can be changed in connection string

3. **Connection Pooling:**
   - Mongoose handles this automatically
   - Default: 5 connections

4. **Indexes:**
   - Email fields auto-indexed (unique)
   - Add more indexes for better performance

---

## 📞 Support

If issues persist:
1. Check MongoDB Atlas status: https://status.mongodb.com/
2. Review MongoDB Atlas docs: https://docs.atlas.mongodb.com/
3. Contact MongoDB support (paid plans only)