import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { createInterface, emitKeypressEvents } from "node:readline";

nextEnv.loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SECRET_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Configurazione Supabase amministrativa mancante.");
  process.exit(1);
}

if (!process.stdin.isTTY) {
  console.error("Esegui questo comando in un terminale interattivo.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function promptHidden(label) {
  return new Promise((resolve, reject) => {
    let value = "";
    process.stdout.write(label);
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("keypress", onKeypress);
    }

    function onKeypress(character, key) {
      if (key?.ctrl && key.name === "c") {
        cleanup();
        process.stdout.write("\n");
        reject(new Error("Operazione annullata"));
        return;
      }
      if (key?.name === "return") {
        cleanup();
        process.stdout.write("\n");
        resolve(value);
        return;
      }
      if (key?.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }
      if (character && !key?.ctrl && !key?.meta) value += character;
    }

    process.stdin.on("keypress", onKeypress);
  });
}

function isStrongPassword(value) {
  return (
    value.length >= 14 &&
    value.length <= 128 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

async function main() {
  const { data: users, error } = await supabase
    .from("users")
    .select("email")
    .eq("is_active", true)
    .order("created_at");

  if (error || !users?.length) {
    throw new Error(error?.message || "Nessun amministratore attivo");
  }

  console.log("Account amministratori attivi:");
  users.forEach((user, index) => console.log(`${index + 1}. ${user.email}`));

  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) =>
    readline.question("Seleziona il numero dell'account: ", resolve),
  );
  readline.close();

  const selected = users[Number(answer) - 1];
  if (!selected) throw new Error("Selezione non valida");

  const password = await promptHidden("Nuova password (input nascosto): ");
  if (!isStrongPassword(password)) {
    throw new Error(
      "Servono 14-128 caratteri, con maiuscole, minuscole, numeri e simboli.",
    );
  }
  const confirmation = await promptHidden("Conferma nuova password: ");
  if (password !== confirmation) throw new Error("Le password non coincidono");

  const { data: updated, error: updateError } = await supabase.rpc(
    "update_user_password",
    { p_email: selected.email, p_new_password: password },
  );
  if (updateError || updated !== true) {
    throw new Error(updateError?.message || "Password non aggiornata");
  }

  await supabase
    .from("admin_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("email", selected.email)
    .is("revoked_at", null);

  console.log("Password aggiornata e sessioni revocate.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Errore inatteso");
  process.exit(1);
});
