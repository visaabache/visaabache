"use client";
import { useEffect } from "react";

/** Adds a subtle fade-up animation to elements with the .reveal class when they enter the viewport. */
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.is-visible), .reveal-stagger:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      }),
      { rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
  return null;
}
