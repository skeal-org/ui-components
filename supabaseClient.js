// supabaseClient.js

// Replace with your Supabase project URL and Anon Key
const SUPABASE_URL = 'https://cosygcghxkeoygncurtl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvc3lnY2doeGtlb3lnbmN1cnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA3NDkwODksImV4cCI6MjAzNjMyNTA4OX0.3Ldaabc1SJFppG7B3PHtJLf_bA9BoalUSEd2qeMMJY8';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
