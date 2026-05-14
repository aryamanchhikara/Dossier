import { createClient } from '@supabase/supabase-js'
import { createLocalClient } from '@/lib/local-db'

export function createServerClient() {
  if (process.env.USE_LOCAL_DB === 'true') {
    return createLocalClient() as ReturnType<typeof createClient>
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
