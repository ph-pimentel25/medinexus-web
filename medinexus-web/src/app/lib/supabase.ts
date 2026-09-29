import { createClient } from "@supabase/supabase-js";

import { observeRecoveryEvent } from "./recovery-session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
supabase.auth.onAuthStateChange((event, session) => observeRecoveryEvent(event, session));

