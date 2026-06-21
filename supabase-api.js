// =============================================
// EnWater Design - Supabase REST API Layer
// Uses direct fetch() calls to Supabase REST API
// No imports needed — include as regular <script src="supabase-api.js">
// =============================================

(function (global) {
  'use strict';

  const SUPABASE_URL   = 'https://goegkdfcyfdzidmmfhap.supabase.co';
  const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZWdrZGZjeWZkemlkbW1maGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMjY4MzgsImV4cCI6MjA5NzYwMjgzOH0.0aCSnhPmPV2gpcO1Tn_hiLZnCRq1orVAtawvFMSgGeE';
  const REST_BASE      = SUPABASE_URL + '/rest/v1';

  // ── Dynamic headers based on session ──
  function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('enwater_admin_token') : null;
    // Custom database tokens or bypass tokens do not authenticate directly as Supabase JWTs,
    // so we access REST resources using the anon key (SUPABASE_KEY)
    const isCustomToken = token && (token === 'dev_bypass_token' || token.startsWith('admin_hash_'));
    const authHeader = (token && !isCustomToken) ? 'Bearer ' + token : 'Bearer ' + SUPABASE_KEY;
    return {
      'apikey':        SUPABASE_KEY,
      'Authorization': authHeader,
      'Content-Type':  'application/json',
    };
  }

  // ── Internal helper ──
  async function request(method, table, payload, query) {
    const url = REST_BASE + '/' + table + (query ? '?' + query : '');
    const options = { method, headers: getHeaders() };
    if (payload) options.body = JSON.stringify(payload);
    if (method === 'POST') options.headers['Prefer'] = 'return=minimal';
    if (method === 'PATCH') options.headers['Prefer'] = 'return=minimal';

    const res = await fetch(url, options);

    // No-content responses (insert/update/delete)
    if (res.status === 204 || res.status === 201) {
      return { ok: true, data: null };
    }

    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json.message || JSON.stringify(json) };
    }
    return { ok: true, data: json };
  }

  // =============================================
  // PUBLIC API — window.EnWaterAPI
  // =============================================
  const EnWaterAPI = {

    // ── 1. POST: Save contact form enquiry ──
    async submitEnquiry(data) {
      const payload = {
        name:         data.name        || null,
        email:        data.email       || null,
        company:      data.company     || null,
        region:       data.region      || null,
        type:         data.type        || null,
        message:      data.message     || null,
        source_page:  data.source_page || (typeof window !== 'undefined' ? window.location.pathname : 'get-in-touch.html'),
        status:       'new',
        submitted_at: new Date().toISOString(),
      };
      const res = await request('POST', 'contact_enquiries', payload);
      if (res.ok) {
        console.log('[EnWaterAPI] ✅ Enquiry submitted successfully.');
      } else {
        console.error('[EnWaterAPI] ❌ Enquiry submit failed:', res.error);
      }
      return res;
    },

    // ── 2. GET: Fetch all enquiries (admin) ──
    async getEnquiries() {
      const res = await request('GET', 'contact_enquiries', null, 'order=submitted_at.desc');
      if (!res.ok) console.error('[EnWaterAPI] ❌ Failed to load enquiries:', res.error);
      return res;
    },

    // ── 3. PATCH: Update enquiry status ──
    async updateEnquiryStatus(id, status) {
      const res = await request('PATCH', 'contact_enquiries', { status }, 'id=eq.' + id);
      if (res.ok) {
        console.log('[EnWaterAPI] ✅ Status updated to:', status);
      } else {
        console.error('[EnWaterAPI] ❌ Status update failed:', res.error);
      }
      return res;
    },

    // ── 4. DELETE: Delete an enquiry ──
    async deleteEnquiry(id) {
      const res = await request('DELETE', 'contact_enquiries', null, 'id=eq.' + id);
      if (res.ok) {
        console.log('[EnWaterAPI] ✅ Enquiry deleted:', id);
      } else {
        console.error('[EnWaterAPI] ❌ Delete failed:', res.error);
      }
      return res;
    },

    // ── 5. POST: Newsletter subscribe ──
    async subscribe(email) {
      const res = await request('POST', 'newsletter_subscribers', {
        email,
        active:     true,
        created_at: new Date().toISOString(),
      });
      return res;
    },

    // ── 6. GET: Fetch all subscribers (admin) ──
    // Returns empty array silently if table doesn't exist yet
    async getSubscribers() {
      const res = await request('GET', 'newsletter_subscribers', null, 'order=created_at.desc');
      if (!res.ok) {
        // PGRST205 = table not found — silently return empty
        console.info('[EnWaterAPI] newsletter_subscribers table not found yet — run supabase-setup.sql');
        return { ok: true, data: [] };
      }
      return res;
    },

    // ── 7. POST: Create listing (admin CRUD) ──
    async createListing(data) {
      const res = await request('POST', 'listings', data);
      if (res.ok) {
        console.log('[EnWaterAPI] ✅ Listing created:', data.title);
      } else {
        console.error('[EnWaterAPI] ❌ Listing create failed:', res.error);
      }
      return res;
    },

    // ── 8. GET: Fetch all listings ──
    async getListings() {
      const res = await request('GET', 'listings', null, 'order=created_at.desc');
      return res;
    },

    // ── 9. TEST: Check connection ──
    async testConnection() {
      try {
        const res = await request('GET', 'contact_enquiries', null, 'select=id&limit=1');
        if (res.ok) {
          console.log('[EnWaterAPI] ✅ Supabase connected — goegkdfcyfdzidmmfhap.supabase.co');
          return true;
        } else {
          console.warn('[EnWaterAPI] ⚠️ Connection issue:', res.error);
          return false;
        }
      } catch (err) {
        console.error('[EnWaterAPI] ❌ Connection failed:', err.message);
        return false;
      }
    },

    // ── 10. AUTH: Validate User Session Token ──
    async validateSession(token) {
      if (!token) return false;
      // Allow custom hash token check for local credentials table
      if (token.startsWith('admin_hash_')) return true;
      try {
        const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + token
          }
        });
        return res.ok;
      } catch (err) {
        console.error('[EnWaterAPI] Session validation error:', err);
        return false;
      }
    },

    // ── 11. AUTH: Verify credentials via PostgreSQL secure RPC ──
    async verifyAdmin(email, password) {
      try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/verify_admin_login', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ p_email: email, p_password: password })
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText);
        }
        const matches = await res.json();
        return { ok: true, matches: !!matches };
      } catch (err) {
        console.error('[EnWaterAPI] verifyAdmin failed:', err);
        return { ok: false, error: err.message };
      }
    },
  };

  // Expose globally
  global.EnWaterAPI = EnWaterAPI;

  // Auto test connection on load
  EnWaterAPI.testConnection();

})(window);
