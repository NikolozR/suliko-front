import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-only client with elevated privileges — never import in client components
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
