// supabaseClient.js

// Replace with your Supabase project URL and Anon Key
const SUPABASE_URL = 'https://bkmc1.skeal.co:4443';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJza2VhbC5jbyIsImlhdCI6MTc0NzE5MzgwMCwiZXhwIjoxODQxODg4MjAwLCJhdWQiOiJwb3J0YWwuc2tlYWwuY28iLCJzdWIiOiJtZWFsIHJlY29yZGluZyBhcHAiLCJyb2xlIjoiYW5vbiJ9.i-W7uS4APv_FYA4yR29a70r1LzCt0J84u5kjWGQiefQ';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
