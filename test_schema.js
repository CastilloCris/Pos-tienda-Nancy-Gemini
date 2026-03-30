import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPayload() {
    // Authenticate using the first user we can find or just simulate an anon insert if RLS allows (wait, RLS needs auth)
    // Actually, we can just login with user's stored session if possible, but we don't have their password here in node.
    // Instead of inserting, we can look at the schema definition using openapi.
    
    // Let's just fetch the swagger/openapi JSON from Supabase to inspect the exact expected types.
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
    const swagger = await res.json();
    
    const ventasDef = swagger.definitions.ventas;
    console.log("Ventas Schema:", JSON.stringify(ventasDef, null, 2));
}

testPayload();
