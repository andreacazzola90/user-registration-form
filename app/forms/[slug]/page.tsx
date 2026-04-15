import { PublicFormSlider } from "@/components/PublicFormSlider";
import { RegistrationForm } from "@/components/RegistrationForm";
import { getPublicFormBySlug } from "@/lib/public-forms";
import { getPublicRegistrationFields } from "@/lib/public-registration-fields";
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
          <RegistrationForm fields={fields.filter((field) => field.active)} />
        </div>
      </section>
    </main>
  );
}
