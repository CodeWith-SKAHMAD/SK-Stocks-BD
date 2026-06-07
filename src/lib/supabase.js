import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://htferxomuewxdbbdqnbd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZmVyeG9tdWV3eGRiYmRxbmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTczNjIsImV4cCI6MjA5NjM3MzM2Mn0.Rd4XVn83gf-YhC5Wq1HsP1oHt3RqpeaZnVX_-vanqHY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
