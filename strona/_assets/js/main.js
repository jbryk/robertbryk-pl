/* =====================================================================
   main.js — nawigacja mobilna, animacje reveal, rok w stopce
   ===================================================================== */
(function () {
  "use strict";

  /* ─── Menu mobilne ─── */
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
    });
    // Zamknij po kliknięciu w link
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Otwórz menu");
      });
    });
  }

  /* ─── Reveal przy scrollu ─── */
  const items = document.querySelectorAll(".reveal");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ─── Rok w stopce ─── */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

})();
