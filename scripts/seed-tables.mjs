import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
    process.env.SECRET_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
const includeSampleRegistrations =
    process.env.SEED_INCLUDE_SAMPLE_REGISTRATIONS === "true";

if (!supabaseUrl || !serviceRoleKey) {
    const missingVars = [];

    if (!supabaseUrl) {
        missingVars.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
    }

    if (!serviceRoleKey) {
        missingVars.push("SECRET_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
    }

    console.error(
        `Missing required environment variables: ${missingVars.join(", ")}`,
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

const defaultFields = [
    {
        key: "first_name",
        label: "Nome",
        field_type: "text",
        required: true,
        active: true,
        sort_order: 1,
        options: [],
    },
    {
        key: "last_name",
        label: "Cognome",
        field_type: "text",
        required: true,
        active: true,
        sort_order: 2,
        options: [],
    },
    {
        key: "phone",
        label: "Telefono",
        field_type: "tel",
        required: true,
        active: true,
        sort_order: 3,
        options: [],
    },
    {
        key: "email",
        label: "Email",
        field_type: "email",
        required: true,
        active: true,
        sort_order: 4,
        options: [],
    },
    {
        key: "children_under_3",
        label: "N. Bambini <3 anni",
        field_type: "number",
        required: true,
        active: true,
        sort_order: 5,
        options: [],
    },
    {
        key: "children_over_3_labs",
        label: "N. Bambini >3 nei laboratori",
        field_type: "number",
        required: true,
        active: true,
        sort_order: 6,
        options: [],
    },
    {
        key: "adults",
        label: "N. Adulti",
        field_type: "number",
        required: true,
        active: true,
        sort_order: 7,
        options: [],
    },
    {
        key: "country",
        label: "Paese di provenienza",
        field_type: "text",
        required: true,
        active: true,
        sort_order: 8,
        options: [],
    },
];

const sampleRegistrations = [
    {
        first_name: "Luca",
        last_name: "Rossi",
        phone: "+39 333 111 2233",
        email: "luca.rossi@example.com",
        country: "Italia",
        children_under_3: 1,
        children_over_3_labs: 1,
        adults: 2,
        additional_data: {},
        status: "confirmed",
    },
    {
        first_name: "Giulia",
        last_name: "Bianchi",
        phone: "+39 333 444 5566",
        email: "giulia.bianchi@example.com",
        country: "Italia",
        children_under_3: 0,
        children_over_3_labs: 2,
        adults: 1,
        additional_data: {},
        status: "waitlist",
    },
];

async function seedEventSettings() {
    const { count, error: countError } = await supabase
        .from("event_settings")
        .select("id", { count: "exact", head: true });

    if (countError) {
        throw new Error(`Cannot read event_settings: ${countError.message}`);
    }

    if ((count ?? 0) > 0) {
        console.log("event_settings already seeded");
        return;
    }

    const { error: insertError } = await supabase.from("event_settings").insert({
        event_name: "Passeggiata Monte di Malo",
        lab_capacity: 50,
    });

    if (insertError) {
        throw new Error(`Cannot seed event_settings: ${insertError.message}`);
    }

    console.log("event_settings seeded");
}

async function seedRegistrationFields() {
    const { error } = await supabase
        .from("registration_fields")
        .upsert(defaultFields, { onConflict: "key" });

    if (error) {
        throw new Error(`Cannot seed registration_fields: ${error.message}`);
    }

    console.log("registration_fields seeded");
}

async function seedRegistrations() {
    if (!includeSampleRegistrations) {
        console.log(
            "registrations seed skipped (set SEED_INCLUDE_SAMPLE_REGISTRATIONS=true to enable)",
        );
        return;
    }

    const { count, error: countError } = await supabase
        .from("registrations")
        .select("id", { count: "exact", head: true });

    if (countError) {
        throw new Error(`Cannot read registrations: ${countError.message}`);
    }

    if ((count ?? 0) > 0) {
        console.log("registrations already contains data, skipping sample seed");
        return;
    }

    const { error } = await supabase.from("registrations").insert(sampleRegistrations);

    if (error) {
        throw new Error(`Cannot seed registrations: ${error.message}`);
    }

    console.log("registrations seeded with sample data");
}

async function run() {
    try {
        await seedEventSettings();
        await seedRegistrationFields();
        await seedRegistrations();
        console.log("Table seed completed");
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("schema cache")) {
            console.error(
                `${message}\nHint: run the initial migration first, then run seed:tables again.`,
            );
            process.exit(1);
        }

        console.error(message);
        process.exit(1);
    }
}

run();
