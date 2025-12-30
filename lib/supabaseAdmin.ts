import { createClient } from '@supabase/supabase-js';

// Inicializar el cliente de Supabase con permisos de administración (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(' Falta configuración de Supabase (URL o Service Key)');
}

// Este cliente tiene permisos totales (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false, // No necesitamos sesión persistente para el backend
        autoRefreshToken: false,
    },
});
