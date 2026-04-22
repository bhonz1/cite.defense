# Deployment Guide - Vercel

## Pre-Deployment Checklist

### 1. Database Schema Update

**IMPORTANT:** Run this SQL in your Supabase SQL Editor to update the users table role constraint:

```sql
-- Update the users table role constraint to include PANEL
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('STUDENT', 'ADMIN', 'SUPERADMIN', 'PANEL'));
```

**Also update existing passwords to bcrypt hash:**

Since we've implemented bcrypt password hashing, existing plain text passwords in the database need to be updated. You have two options:

**Option A: Reset all admin passwords**
```sql
-- This will require all users to reset their passwords
-- Generate a new bcrypt hash for the default admin
-- You can use an online bcrypt generator or run this in Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hash('your-new-password', 10);
-- console.log(hash);

-- Then update the admin user
UPDATE users SET password = '$2a$10$your-bcrypt-hash-here' WHERE username = 'admin';
```

**Option B: Create a password reset script**
Create a temporary script to hash existing passwords and update the database.

### 2. Environment Variables Setup

In Vercel Dashboard, add these environment variables:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - Example: `https://eefqofgnxktvgfcsbhyc.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
  - Get this from Supabase Dashboard → Project Settings → API

**Note:** Do NOT use the `service_role` key as an environment variable. The anon key is safe for client-side use and has appropriate RLS policies.

### 3. Vercel Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial deployment"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure project settings

3. **Set Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add the two required variables from step 2

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Vercel will provide a production URL

### 4. Post-Deployment Tasks

1. **Test Authentication**
   - Try logging in with existing admin credentials
   - If passwords were plain text, you'll need to reset them
   - Create a script to hash existing passwords or reset via Supabase directly

2. **Test Role-Based Access**
   - Verify ADMIN users can access `/admin`
   - Verify SUPERADMIN users can access `/admin`
   - Verify other roles are redirected appropriately

3. **Test User Management**
   - Try creating a new user via the admin panel
   - Verify the user is saved to the database
   - Verify the password is hashed

4. **Test Appointment Management**
   - Create, update, and delete appointments
   - Verify confirmation modals work
   - Check panelist assignment

### 5. Security Notes

**Implemented:**
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ httpOnly session cookies
- ✅ Role-based access control
- ✅ SQL injection protection (Supabase parameterized queries)
- ✅ XSS protection (React auto-escapes)
- ✅ .gitignore to prevent credential leaks

**Not Implemented (Consider for future):**
- ⚠️ CSRF protection (consider implementing for production)
- ⚠️ Rate limiting (consider implementing for production)
- ⚠️ JWT tokens (current implementation uses base64-encoded session)
- ⚠️ Password reset functionality
- ⚠️ Two-factor authentication

### 6. Troubleshooting

**Login fails after deployment:**
- Check that environment variables are set correctly in Vercel
- Verify Supabase project is accessible
- Check that RLS policies allow appropriate access

**User creation fails:**
- Verify the role constraint has been updated in the database
- Check that the anon key has insert permissions on the users table

**Database connection errors:**
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Check Supabase project status (not paused)
- Verify RLS policies are not blocking access

### 7. Default Credentials

The default admin user in the database schema:
- Username: `admin`
- Password: `admin123` (plain text - needs to be hashed)

**To update the default admin password:**
1. Generate a bcrypt hash: https://bcrypt-generator.com/
2. Run in Supabase SQL Editor:
```sql
UPDATE users SET password = '$2a$10$your-bcrypt-hash-here' WHERE username = 'admin';
```

### 8. Monitoring

After deployment:
- Monitor Vercel logs for errors
- Check Supabase logs for database issues
- Set up error tracking (e.g., Sentry) for production
- Monitor user activity and suspicious behavior
