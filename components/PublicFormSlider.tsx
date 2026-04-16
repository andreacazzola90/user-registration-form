"use client";

import { useEffect, useState } from "react";

import type { SliderSlide } from "@/lib/types";

type SliderTextPhase = "static" | "entering" | "exiting" | "hidden";

const DEFAULT_SLIDES: SliderSlide[] = [
  {
    title: "Un mattino nella natura",
    description:
      "Passeggiata itinerante con laboratori per bambini, tra sentieri e punti di scoperta.",
    imageUrl:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1800&q=80",
  },
  {
    title: "Si parte insieme",
    description:
      "Accoglienza dalle 9.30 alle 10.00 e partenza alle 10.00 per vivere il percorso in gruppo.",
    imageUrl:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1800&q=80",
  },
  {
    title: "Organizzazione semplice",
    description:
      "Compila il modulo a destra per confermare la partecipazione e ricevere la mail di conferma.",
    imageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1800&q=80",
  },
];

export function PublicFormSlider({ slides }: { slides?: SliderSlide[] }) {
  const slidesToDisplay = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const slideCount = slidesToDisplay.length;
  const isSingleSlide = slideCount === 1;
  const secondsPerSlide = 6;
  const slideDurationMs = secondsPerSlide * 1000;
  const textExitLeadMs = 550;
  const textEnterDelayMs = 700;
  const totalDuration = Math.max(slideCount * secondsPerSlide, secondsPerSlide);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [textPhase, setTextPhase] = useState<SliderTextPhase>(
    isSingleSlide ? "static" : "entering",
  );

  useEffect(() => {
    if (isSingleSlide) {
      setActiveSlideIndex(0);
      setTextPhase("static");
      return;
    }

    let exitTimerId: number | undefined;
    let switchTimerId: number | undefined;
    let enterTimerId: number | undefined;
    let disposed = false;

    const scheduleCycle = () => {
      exitTimerId = window.setTimeout(() => {
        if (disposed) {
          return;
        }

        setTextPhase("exiting");
      }, slideDurationMs - textExitLeadMs);

      switchTimerId = window.setTimeout(() => {
        if (disposed) {
          return;
        }

        setActiveSlideIndex((currentIndex) => (currentIndex + 1) % slideCount);
        setTextPhase("hidden");

        enterTimerId = window.setTimeout(() => {
          if (disposed) {
            return;
          }

          setTextPhase("entering");
        }, textEnterDelayMs);

        scheduleCycle();
      }, slideDurationMs);
    };

    setTextPhase("entering");
    scheduleCycle();

    return () => {
      disposed = true;

      if (exitTimerId) {
        window.clearTimeout(exitTimerId);
      }

      if (switchTimerId) {
        window.clearTimeout(switchTimerId);
      }

      if (enterTimerId) {
        window.clearTimeout(enterTimerId);
      }
    };
  }, [
    isSingleSlide,
    slideCount,
    slideDurationMs,
    textEnterDelayMs,
    textExitLeadMs,
  ]);

  const activeSlide = slidesToDisplay[activeSlideIndex] ?? slidesToDisplay[0];
  const textPhaseClassName =
    textPhase === "static"
      ? "is-static"
      : textPhase === "entering"
        ? "is-entering"
        : textPhase === "exiting"
          ? "is-exiting"
          : "is-hidden";

  return (
    <div className="public-slider-root">
      <div className="public-slider-track" aria-hidden="true">
        {slidesToDisplay.map((slide, index) => (
          <article
            key={`${slide.title}-${index}`}
            className="public-slider-slide"
          >
            <div
              className="public-slider-media"
              style={{
                backgroundImage: `url('${slide.imageUrl}')`,
                ...(isSingleSlide
                  ? { animation: "none", opacity: 1 }
                  : {
                      animationDelay: `${index * secondsPerSlide}s`,
                      animationDuration: `${totalDuration}s`,
                    }),
              }}
            />
          </article>
        ))}
      </div>
      <div key={activeSlideIndex} className="public-slider-content">
        <div className="public-slider-wash" aria-hidden="true" />
        <div
          key={`${activeSlide.title}-${activeSlideIndex}`}
          className={`public-slider-copy ${textPhaseClassName}`}
        >
          <h2 className="public-slider-title">{activeSlide.title}</h2>
          <p className="public-slider-description">{activeSlide.description}</p>
        </div>
      </div>
      <div className="public-slider-overlay" aria-hidden="true" />
    </div>
  );
}
