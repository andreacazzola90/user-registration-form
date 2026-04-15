const SLIDES = [
  {
    kicker: "Tra i fili d'erba",
    title: "Un mattino nella natura",
    description:
      "Passeggiata itinerante con laboratori per bambini, tra sentieri e punti di scoperta.",
    imageUrl:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1800&q=80",
  },
  {
    kicker: "Famiglie e bambini",
    title: "Si parte insieme",
    description:
      "Accoglienza dalle 9.30 alle 10.00 e partenza alle 10.00 per vivere il percorso in gruppo.",
    imageUrl:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1800&q=80",
  },
  {
    kicker: "Esperienza all'aperto",
    title: "Organizzazione semplice",
    description:
      "Compila il modulo a destra per confermare la partecipazione e ricevere la mail di conferma.",
    imageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1800&q=80",
  },
] as const;

export function PublicFormSlider() {
  return (
    <div className="public-slider-root">
      <div className="public-slider-track" aria-hidden="true">
        {SLIDES.map((slide) => (
          <article key={slide.title} className="public-slider-slide">
            <div
              className="public-slider-media"
              style={{ backgroundImage: `url('${slide.imageUrl}')` }}
            />
            <div className="public-slider-content">
              <p className="public-slider-kicker">{slide.kicker}</p>
              <h2 className="public-slider-title">{slide.title}</h2>
              <p className="public-slider-description">{slide.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="public-slider-overlay" aria-hidden="true" />
    </div>
  );
}
