import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
    process.env.SECRET_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
    console.error(
        "Missing NEXT_PUBLIC_SUPABASE_URL, service role key, ADMIN_EMAIL, or ADMIN_PASSWORD",
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function seedAdmin() {
    const { data: existing, error: listError } = await supabase
        .from("users")
        .select("email")
        .eq("email", adminEmail.toLowerCase().trim())
        .maybeSingle();

    if (listError) {
        console.error("Cannot list users:", listError.message);
        process.exit(1);
    }

    if (existing) {
        console.log(`Admin already exists: ${adminEmail}`);
        return;
    }

    const { error: createError } = await supabase.rpc("create_user_with_password", {
        p_email: adminEmail,
        p_password: adminPassword,
        p_full_name: "Admin",
    });

    if (createError) {
        console.error("Failed to create admin:", createError.message);
        process.exit(1);
    }

    console.log(`Admin created: ${adminEmail}`);
}

seedAdmin();
