import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
});
export async function connectSupabase() {
    try {
        const { data, error } = await supabase.from('empresas').select('count').limit(1);
        if (error) {
            console.error('❌ Supabase connection failed:', error);
            process.exit(1);
        }
        console.log('✅ Supabase connected successfully');
    }
    catch (error) {
        console.error('❌ Supabase connection failed:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=supabase.js.map