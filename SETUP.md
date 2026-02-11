# MongoDB Setup Guide

## Option 1: Local MongoDB Installation

### Windows:
1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Install MongoDB
3. Start MongoDB service:
```
   net start MongoDB
```
4. Your connection string: `mongodb://localhost:27017/workhub_admin`

### Mac (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu):
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Option 2: MongoDB Atlas (Cloud - Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (Free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace in `.env`:
```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workhub_admin?retryWrites=true&w=majority
```

## Verify Connection
```bash
cd backend
npm run dev
```

You should see: `✅ MongoDB Connected Successfully`

## Create Admin User (Optional)

Run this in MongoDB shell or Compass:
```javascript
use workhub_admin

db.users.insertOne({
  name: "Admin User",
  email: "admin@workhub.com",
  password: "$2a$10$Your