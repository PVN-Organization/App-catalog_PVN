import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qxeoypsdgkgaubyylskr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4ZW95cHNkZ2tnYXVieXlsc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTI0MDMsImV4cCI6MjA3MjQ2ODQwM30.JZ78KYoFMkZNf6rTfcY1xQfIRV8B2AcYEhFLng5CsoU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Database Supabase URL and Anon Key are required.');
}

export const databaseSupabase = createClient(supabaseUrl, supabaseAnonKey);
