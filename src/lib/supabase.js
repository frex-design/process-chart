import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rrsbyiypwgnwzqadwpky.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyc2J5aXlwd2dud3pxYWR3cGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTI4NjMsImV4cCI6MjA4OTU2ODg2M30.ZNc4AebnJkBzQFvcxW_Pv2TSEBncyeuapCHE5IAeJQg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
