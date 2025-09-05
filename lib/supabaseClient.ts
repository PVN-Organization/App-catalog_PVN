import { createClient } from '@supabase/supabase-js';

// Client duy nhất cho cả Xác thực (SSO) và Dữ liệu
const supabaseUrl = 'https://svqfhaopisjxwuhirdct.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2cWZoYW9waXNqeHd1aGlyZGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzAzMzksImV4cCI6MjA3MjU0NjMzOX0.zbGERNcY5Vzj1PJhFwSaN7xxalt0wxT87gRILuBfkLc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL và Anon Key là bắt buộc.');
}

// Xuất ra một client Supabase duy nhất để sử dụng trong toàn bộ ứng dụng
export const supabase = createClient(supabaseUrl, supabaseAnonKey);