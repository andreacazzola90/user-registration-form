import { RegistrationForm } from "@/components/RegistrationForm";
import { DEFAULT_REGISTRATION_FIELDS } from "@/lib/default-fields";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistrationField } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getFields(): Promise<RegistrationField[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("registration_fields")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return DEFAULT_REGISTRATION_FIELDS.map((field, index) => ({
        ...field,
        id: `default-${index}`,
      }));
    }

    return data as RegistrationField[];
  } catch {
    return DEFAULT_REGISTRATION_FIELDS.map((field, index) => ({
      ...field,
      id: `default-${index}`,
    }));
  }
}

export default async function HomePage() {
  const fields = await getFields();

  return (
    <main className="container">
      <section
        className="card"
        style={{ padding: "2rem", marginBottom: "1rem" }}
      >
        <h1
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginBottom: "0.5rem" }}
        >
          Passeggiata Monte di Malo
        </h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Iscriviti online. I posti ai laboratori bambini ({">3 anni"}) sono
          limitati. Al superamento del limite, le nuove iscrizioni entrano
          automaticamente in lista d&apos;attesa.
        </p>
      </section>

      <section className="card" style={{ padding: "1.5rem" }}>
        <RegistrationForm fields={fields.filter((field) => field.active)} />
      </section>
    </main>
  );
}
