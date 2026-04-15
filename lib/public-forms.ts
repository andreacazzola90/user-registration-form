export type PublicFormDefinition = {
  slug: string;
  title: string;
  description: string;
};

export const PUBLIC_FORMS: PublicFormDefinition[] = [
  {
    slug: "passeggiata-monte-di-malo",
    title: "Passeggiata Monte di Malo",
    description:
      "Iscrizione pubblica alla passeggiata itinerante con laboratori per bambini.",
  },
];

export function getPublicFormBySlug(slug: string) {
  return PUBLIC_FORMS.find((form) => form.slug === slug) ?? null;
}
