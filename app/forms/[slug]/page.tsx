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
  const form = getPublicFormBySlug(slug);

  if (!form) {
    notFound();
  }

  const fields = await getPublicRegistrationFields();
  let labCapacityReached = false;

  try {
    const supabase = createSupabaseAdminClient();
    const [settingsResponse, confirmedResponse] = await Promise.all([
      supabase
        .from("event_settings")
        .select("lab_capacity")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("registrations")
        .select("children_over_3_labs")
        .eq("status", "confirmed"),
    ]);

    if (!settingsResponse.error && !confirmedResponse.error) {
      const labCapacity = settingsResponse.data?.lab_capacity ?? 50;
      const confirmedChildrenOver3Labs = (confirmedResponse.data ?? []).reduce(
        (total, row) => total + Number(row.children_over_3_labs ?? 0),
        0,
      );

      labCapacityReached = confirmedChildrenOver3Labs >= labCapacity;
    }
  } catch {
    labCapacityReached = false;
  }

  return (
    <main className="public-form-layout">
      <section
        className="public-form-slider-pane"
        aria-label="Anteprima evento"
      >
        <PublicFormSlider />
      </section>

      <section className="public-form-content-pane">
        <div className="public-form-content-inner">
          <h1 className="sr-only">{`Modulo pubblico: ${form.title}`}</h1>
          <RegistrationForm
            fields={fields.filter((field) => field.active)}
            labCapacityReached={labCapacityReached}
          />
        </div>
      </section>
    </main>
  );
}
