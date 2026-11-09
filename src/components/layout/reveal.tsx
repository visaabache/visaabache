"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll-in effect for elements with .reveal / .reveal-stagger.
 * REVEAL_SCRIPT runs inline as soon as the HTML is parsed (before React and the page's JavaScript have loaded),
 * so sections appear immediately instead of staying blank on slow connections. Elements start animating a bit
 * before they enter the viewport. A data attribute (not a class) marks them as shown, so React hydration does not
 * see a className mismatch. RevealObserver re-applies it after client-side navigations.
 */
export const REVEAL_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");var io;function scan(){var els=document.querySelectorAll(".reveal:not([data-in]),.reveal-stagger:not([data-in])");if(!("IntersectionObserver" in window)){els.forEach(function(e){e.setAttribute("data-in","")});return}io=io||new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.setAttribute("data-in","");io.unobserve(en.target)}})},{rootMargin:"0px 0px 60% 0px"});els.forEach(function(e){io.observe(e)})}window.__vaReveal=scan;if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",scan)}else{scan()}})();`;

export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const scan = (window as unknown as { __vaReveal?: () => void }).__vaReveal;
    if (scan) scan();
    else document.querySelectorAll(".reveal, .reveal-stagger").forEach((e) => e.setAttribute("data-in",""));
  }, [pathname]);
  return null;
}
