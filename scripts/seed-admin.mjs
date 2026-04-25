import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
    process.env.SECRET_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || "andracazzola90@gmail.com";
const adminPassword =
    process.env.SECRET_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    "farfalla24";

if (!supabaseUrl || !serviceRoleKey) {
    console.error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SECRET_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)",
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
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Cannot list users:", listError.message);
        process.exit(1);
    }

    const existing = usersData.users.find((user) => user.email === adminEmail);

    if (existing) {
        console.log(`Admin already exists: ${adminEmail}`);
        return;
    }

    const { error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
    });

    if (createError) {
        console.error("Failed to create admin:", createError.message);
        process.exit(1);
    }

    console.log(`Admin created: ${adminEmail}`);
}

seedAdmin();
