/**
 * Password Migration Script
 * 
 * This script converts existing plain text passwords to bcrypt hashes.
 * Run this script after implementing bcrypt password hashing.
 * 
 * Usage:
 * 1. Set your Supabase credentials in the environment
 * 2. Run: node scripts/migrate-passwords.js
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePasswords() {
  try {
    console.log('Fetching users from database...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, password');
    
    if (error) {
      console.error('Error fetching users:', error);
      process.exit(1);
    }
    
    if (!users || users.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      // Check if password is already a bcrypt hash (starts with $2a$ or $2b$)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`Skipping ${user.username} - password already hashed`);
        skippedCount++;
        continue;
      }
      
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Update the user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`Error updating password for ${user.username}:`, updateError);
      } else {
        console.log(`✓ Updated password for ${user.username}`);
        updatedCount++;
      }
    }
    
    console.log('\nMigration complete!');
    console.log(`Updated: ${updatedCount} users`);
    console.log(`Skipped: ${skippedCount} users (already hashed)`);
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migratePasswords();
