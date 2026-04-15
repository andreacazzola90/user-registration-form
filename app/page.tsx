import { PUBLIC_FORMS } from "@/lib/public-forms";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <main className="admin-backdrop min-h-screen">
      <div className="public-shell py-8 md:py-12">
        <section className="rounded-2xl border border-[#b9c5d1] bg-white p-6 md:p-8">
          <h1 className="font-[var(--font-serif)] text-4xl font-bold text-[#1f2f35] md:text-5xl">
            Form pubblici disponibili
          </h1>
          <p className="mt-3 text-base text-[#445867] md:text-lg">
            Seleziona il modulo che vuoi compilare.
          </p>

          <ul className="mt-6 grid gap-4">
            {PUBLIC_FORMS.map((form) => (
              <li key={form.slug}>
                <Link
                  href={`/forms/${form.slug}`}
                  className="block rounded-xl border border-[#c2ccd8] bg-[#f8fafc] p-4 transition hover:border-[#0f8a84] hover:bg-[#f2fbfa]"
                >
                  <p className="font-semibold text-[#1f2d37]">{form.title}</p>
                  <p className="mt-1 text-sm text-[#445867]">
                    {form.description}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#0f8a84]">
                    Apri il form
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
