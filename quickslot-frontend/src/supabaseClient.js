import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://widdsbfdmyryfadarway.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZGRzYmZkbXlyeWZhZGFyd2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDMwMTAsImV4cCI6MjA5MDI3OTAxMH0.DCA5x9RS8az55bJY_WHEhXW4Rcuj-LCDKwM5lW7aPJ8'

export const supabase = createClient(supabaseUrl, supabaseKey)