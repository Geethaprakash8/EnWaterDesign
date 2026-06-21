// =============================================
// EnWater Design - Supabase Client
// Connects static HTML pages to Supabase backend
// Project: d:\Project Check
// =============================================

// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://goegkdfcyfdzidmmfhap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZWdrZGZjeWZkemlkbW1maGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMjY4MzgsImV4cCI6MjA5NzYwMjgzOH0.0aCSnhPmPV2gpcO1Tn_hiLZnCRq1orVAtawvFMSgGeE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// =============================================
// TEST CONNECTION on load
// =============================================
(async () => {
  const { error } = await supabase.from('contact_enquiries').select('id').limit(1);
  if (error && error.code !== 'PGRST116') {
    console.warn('[Supabase] Connection check warning:', error.message);
  } else {
    console.log('[Supabase] ✅ Connected to goegkdfcyfdzidmmfhap.supabase.co');
  }
})();

// =============================================
// saveContactForm()
// Saves get-in-touch form data to contact_enquiries table
// Fields: name, email, company, region, type, message, source_page
// =============================================
export async function saveContactForm(data) {
  const { error } = await supabase
    .from('contact_enquiries')
    .insert([{
      name: data.name || null,
      email: data.email || null,
      company: data.company || null,
      region: data.region || null,
      type: data.type || null,
      message: data.message || null,
      source_page: data.source_page || window.location.pathname,
      submitted_at: new Date().toISOString(),
    }]);

  if (error) {
    console.error('[Supabase] ❌ Error saving contact form:', error.message);
    return { success: false, error };
  }

  console.log('[Supabase] ✅ Contact enquiry saved successfully.');
  return { success: true };
}

// =============================================
// logPageVisit()
// Logs page visit analytics to page_visits table
// Usage: logPageVisit() — call on any page load
// =============================================
export async function logPageVisit(pageName) {
  const { error } = await supabase
    .from('page_visits')
    .insert([{
      page: pageName || window.location.pathname,
      referrer: document.referrer || null,
      visited_at: new Date().toISOString(),
    }]);

  if (error) {
    console.warn('[Supabase] Could not log page visit:', error.message);
  }
}
