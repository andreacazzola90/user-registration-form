import { redirect } from "next/navigation";
import { AdminDashboardTabs } from "@/components/AdminDashboardTabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistrationField, RegistrationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [fieldsResponse, registrationsResponse, settingsResponse] =
    await Promise.all([
      supabase
        .from("registration_fields")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("event_settings")
        .select("lab_capacity")
        .limit(1)
        .maybeSingle(),
    ]);

  if (fieldsResponse.error) {
    throw new Error(fieldsResponse.error.message);
  }

  if (registrationsResponse.error) {
    throw new Error(registrationsResponse.error.message);
  }

  return {
    fields: (fieldsResponse.data ?? []) as RegistrationField[],
    registrations: (registrationsResponse.data ?? []) as RegistrationRecord[],
    capacity: settingsResponse.data?.lab_capacity ?? 50,
    email: user.email ?? "admin",
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <main className="container">
      <section
        className="card"
        style={{ padding: "1.2rem", marginBottom: "1rem" }}
      >
        <h1 style={{ marginBottom: "0.3rem" }}>Dashboard Admin</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Sessione: {data.email} | Capienza laboratori: {data.capacity}
        </p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <a className="btn btn-secondary" href="/api/export/csv">
            Download CSV
          </a>
          <a className="btn btn-secondary" href="/api/export/xlsx">
            Download XLSX
          </a>
          <a
            className="btn btn-secondary"
            href="/api/qr"
            target="_blank"
            rel="noreferrer"
          >
            Apri QR iscrizione
          </a>
          <a
            className="btn btn-secondary"
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            Vai al modulo pubblico
          </a>
        </div>
      </section>

      <AdminDashboardTabs
        fields={data.fields}
        registrations={data.registrations}
        capacity={data.capacity}
      />
    </main>
  );
}
