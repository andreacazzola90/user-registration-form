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
    <main className="admin-backdrop min-h-screen">
      <div className="public-shell pt-8 pb-2 md:pt-12 md:pb-3">
        <h1 className="sr-only">{`Modulo pubblico: ${form.title}`}</h1>
        <RegistrationForm fields={fields.filter((field) => field.active)} />
      </div>
    </main>
  );
}
