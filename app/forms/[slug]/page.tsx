import { PublicFormSlider } from "@/components/PublicFormSlider";
import { RegistrationForm } from "@/components/RegistrationForm";
import { getPublicFormBySlug } from "@/lib/public-forms";
import { getPublicRegistrationFields } from "@/lib/public-registration-fields";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicFormPage({ params }: Props) {
  const { slug } = await params;
  const form = await getPublicFormBySlug(slug);

  if (!form) {
    notFound();
  }

  const fields = await getPublicRegistrationFields(form.id);
  let labCapacityReached = false;
  let registrationsClosed = false;

  try {
    const supabase = createSupabaseAdminClient();
    const [settingsResponse, confirmedResponse, registrationsCountResponse] = await Promise.all([
      supabase
        .from("event_settings")
        .select("lab_capacity, max_participants, registrations_close_at")
        .eq("form_id", form.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("registrations")
        .select("children_over_3_labs")
        .eq("form_id", form.id)
        .eq("status", "confirmed"),
      supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("form_id", form.id),
    ]);

    if (
      !settingsResponse.error &&
      !confirmedResponse.error &&
      !registrationsCountResponse.error
    ) {
      const labCapacity = settingsResponse.data?.lab_capacity ?? 50;
      const maxParticipants = settingsResponse.data?.max_participants ?? 200;
      const registrationsCloseAt = settingsResponse.data?.registrations_close_at;
      const totalRegistrations = registrationsCountResponse.count ?? 0;

      const confirmedChildrenOver3Labs = (confirmedResponse.data ?? []).reduce(
        (total, row) => total + Number(row.children_over_3_labs ?? 0),
        0,
      );

      labCapacityReached = confirmedChildrenOver3Labs >= labCapacity;
      registrationsClosed = totalRegistrations >= maxParticipants;

      if (registrationsCloseAt) {
        const closeDate = new Date(registrationsCloseAt);
        if (!Number.isNaN(closeDate.getTime()) && Date.now() >= closeDate.getTime()) {
          registrationsClosed = true;
        }
      }
    }
  } catch {
    labCapacityReached = false;
    registrationsClosed = false;
  }

  return (
    <main className="public-form-layout">
      <section
        className="public-form-slider-pane"
        aria-label="Anteprima evento"
      >
        <PublicFormSlider slides={form.slider_data} />
      </section>

      <section className="public-form-content-pane">
        <div className="public-form-content-inner">
          <h1 className="sr-only">{`Modulo pubblico: ${form.title}`}</h1>
          <RegistrationForm
            formId={form.id}
            form={form}
            fields={fields.filter((field) => field.active)}
            labCapacityReached={labCapacityReached}
            registrationsClosed={registrationsClosed}
          />
        </div>
      </section>
    </main>
  );
}
