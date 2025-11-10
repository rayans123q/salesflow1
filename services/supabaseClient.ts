import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zimlbwfmiakbwijwmcpq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbWxid2ZtaWFrYndpandtY3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODEyNDYsImV4cCI6MjA3ODI1NzI0Nn0.ba2TSnunwGp2jh5lgtIqXzdmhfnDZVh8PTpz-GouJnU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

