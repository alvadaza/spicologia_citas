// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- CONFIGURA TU SUPABASE ---
const supabaseUrl = "https://dbhzwjgfknkyiesudnji.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaHp3amdma25reWllc3VkbmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTIxMjYsImV4cCI6MjA3NjYyODEyNn0.-_SubqCHNLF5QfbqOFAl7jJuemyAOrwLp9WkbbEx5MM";

export const supabase = createClient(supabaseUrl, supabaseKey);
