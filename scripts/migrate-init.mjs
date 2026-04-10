import nextEnv from "@next/env";
import { execFileSync } from "node:child_process";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

function buildDbUrl() {
    const rawPoolerUrl = process.env.SUPABASE_DB_POOLER_URL?.trim();
    const rawDbUrl = process.env.SUPABASE_DB_URL?.trim();
    const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
    const dbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();
    const usePooler = process.env.SUPABASE_USE_POOLER === "true";
    const poolerHost =
        process.env.SUPABASE_POOLER_HOST?.trim() ||
        "aws-0-eu-west-1.pooler.supabase.com";
    const poolerPort = process.env.SUPABASE_POOLER_PORT?.trim() || "6543";

    function validateUrl(value, envVarName) {
        if (
            value.includes("[YOUR-PASSWORD]") ||
            value.includes("[YOUR-PROJECT-REF]")
        ) {
            console.error(
                `${envVarName} contains template placeholders. Replace them with real values.`,
            );
            process.exit(1);
        }

        try {
            new URL(value);
        } catch {
            console.error(
                `${envVarName} is not a valid URL. If your password contains special characters, URL-encode it (or use SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD).`,
            );
            process.exit(1);
        }
    }

    if (rawPoolerUrl) {
        validateUrl(rawPoolerUrl, "SUPABASE_DB_POOLER_URL");
        return rawPoolerUrl;
    }

    if (rawDbUrl) {
        validateUrl(rawDbUrl, "SUPABASE_DB_URL");

        return rawDbUrl;
    }

    if (projectRef && dbPassword) {
        const encodedPassword = encodeURIComponent(dbPassword);

        if (usePooler) {
            return `postgresql://postgres.${projectRef}:${encodedPassword}@${poolerHost}:${poolerPort}/postgres`;
        }

        return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
    }

    console.error(
        "Missing database connection settings. Provide SUPABASE_DB_POOLER_URL, SUPABASE_DB_URL, or both SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD.",
    );
    process.exit(1);
}

const dbUrl = buildDbUrl();

try {
    execFileSync("npx", ["supabase", "db", "push", "--db-url", dbUrl], {
        stdio: "inherit",
    });
    console.log("Initial migration applied");
} catch {
    process.exit(1);
}
