import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjnntdstvkrkjjojahdt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbm50ZHN0dmtya2pqb2phaGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjY1NjEsImV4cCI6MjA3MDgwMjU2MX0.N36jPFUU7rKxM8KSUDtrqkd3FrDvCivY7THLCEoNyEw';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
