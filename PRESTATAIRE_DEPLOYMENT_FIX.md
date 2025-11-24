# Prestataire Routes - Deployment Troubleshooting

## Issue: 404 Error on `/prestataire/list`

The 404 error on Vercel indicates that the prestataire routes are not accessible. Here's how to fix it:

## ✅ Verification Steps

### 1. Check Local Development First

**Test the health endpoint:**
```bash
# Local test
curl http://localhost:8081/prestataire/health

# Expected response:
{
  "status": "ok",
  "message": "Prestataire routes are working",
  "timestamp": "2025-11-23T13:55:00.000Z"
}
```

**Test the list endpoint:**
```bash
curl http://localhost:8081/prestataire/list
```

### 2. Verify Files Are Committed to Git

**Check that all new files are tracked:**
```bash
cd /Users/youssefdiouri/Workspace/coproxDashboard

# Check git status
git status

# Should see these files as either committed or staged:
# server/src/models/prestataire.js
# server/src/models/prestataireCopro.js
# server/src/services/prestataireService.js
# server/src/controllers/prestataireController.js
# server/src/routes/prestataireRoutes.js
# server/src/cron/synchroPrestataire.js
```

**If files are untracked, add them:**
```bash
git add server/src/models/prestataire.js
git add server/src/models/prestataireCopro.js
git add server/src/services/prestataireService.js
git add server/src/controllers/prestataireController.js
git add server/src/routes/prestataireRoutes.js
git add server/src/cron/synchroPrestataire.js
git add server/index.js
git add server/src/cron/cronStart.js

git commit -m "Add prestataire entity with sync and cleanup features"
git push origin main
```

### 3. Restart Local Server

If running locally, restart the server to load the new routes:

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd server
node index.js
# or if using nodemon:
npm start
```

### 4. Vercel Deployment

**Trigger a new deployment:**
```bash
# Option 1: Push to trigger auto-deployment
git push origin main

# Option 2: Manual deployment via Vercel CLI
vercel --prod

# Option 3: Redeploy from Vercel Dashboard
# Go to vercel.com → Your project → Deployments → Redeploy
```

### 5. Check Vercel Build Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click on the latest deployment
4. Check "Build Logs" for any errors
5. Look for messages like:
   - `Cannot find module './src/routes/prestataireRoutes.js'`
   - File path errors
   - Missing dependencies

### 6. Verify Package.json Dependencies

Ensure all required packages are in `package.json`:
```bash
cd server
npm list mongoose
npm list express
```

If missing:
```bash
npm install mongoose express --save
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

## 🔍 Common Issues & Solutions

### Issue: "Cannot find module"
**Cause:** Files not committed to git
**Solution:** 
```bash
git add server/src/routes/prestataireRoutes.js
git commit -m "Add prestataire routes"
git push
```

### Issue: Routes work locally but not on Vercel
**Cause:** Case sensitivity (Mac/Windows vs Linux)
**Solution:** Ensure consistent casing:
- File: `prestataireRoutes.js`
- Import: `require('./src/routes/prestataireRoutes.js')`

### Issue: 500 Internal Server Error instead of 404
**Cause:** Database connection or service initialization issue
**Solution:** Check Vercel environment variables:
```bash
# Verify in Vercel Dashboard → Settings → Environment Variables
MONGODB_URI=...
VILOGI_TOKEN=...
VILOGI_IDAUTH=...
```

### Issue: Old deployment is cached
**Cause:** Vercel caching
**Solution:** 
1. Go to Vercel Dashboard
2. Deployments → Latest → ⋮ (three dots) → Redeploy
3. Check "Use existing Build Cache" is OFF

## 🚀 Quick Fix Command Sequence

Run these commands in order:

```bash
# 1. Verify files exist locally
ls -la server/src/routes/prestataireRoutes.js
ls -la server/src/controllers/prestataireController.js
ls -la server/src/services/prestataireService.js

# 2. Check git status
git status

# 3. Add all prestataire files if not tracked
git add server/src/models/prestataire*.js
git add server/src/services/prestataireService.js
git add server/src/controllers/prestataireController.js
git add server/src/routes/prestataireRoutes.js
git add server/src/cron/synchroPrestataire.js
git add server/index.js
git add server/src/cron/cronStart.js

# 4. Commit and push
git commit -m "Add prestataire module with full CRUD and sync"
git push origin main

# 5. Wait for Vercel auto-deployment (2-3 minutes)
# Or manually trigger deployment

# 6. Test on Vercel
curl https://coprox-dashboard-back.vercel.app/prestataire/health
```

## 📊 Testing After Deployment

Once deployed, test these endpoints in order:

```bash
BASE_URL="https://coprox-dashboard-back.vercel.app"

# 1. Health check (should work immediately)
curl $BASE_URL/prestataire/health

# 2. List prestataires (requires MongoDB connection)
curl $BASE_URL/prestataire/list

# 3. Trigger sync (requires Vilogi credentials)
curl -X POST $BASE_URL/prestataire/sync
```

## 🆘 If Still Not Working

1. **Check Vercel Function Logs:**
   - Dashboard → Your Project → Functions
   - Look for runtime errors

2. **Verify Server Startup:**
   - Check if `server/index.js` has errors
   - Ensure all requires are correct

3. **Test with Simple Endpoint:**
   ```javascript
   // Add to server/index.js temporarily
   app.get('/test-prestataire', (req, res) => {
     res.json({ test: 'working' });
   });
   ```

4. **Contact Support:**
   - Share Vercel build logs
   - Share local `git status` output
   - Share any console errors

## ✅ Success Indicators

You'll know it's working when:
- ✅ `GET /prestataire/health` returns `{"status":"ok"}`
- ✅ `GET /prestataire/list` returns `[]` or array of prestataires
- ✅ No 404 errors in Vercel logs
- ✅ Routes appear in server startup logs

---

**Most Common Solution:** The files weren't committed to git. Run the "Quick Fix Command Sequence" above.
