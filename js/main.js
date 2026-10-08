/* =========================================================
   Natalia Asesora – lógica de CTAs, medición y UI
   ========================================================= */

/* -----------------------------------------------------------
   1) CONFIGURACIÓN: completá el número de WhatsApp
   [NÚMERO EN FORMATO 549 + CÓDIGO DE ÁREA + NÚMERO, SIN 0 NI 15]
   Ejemplo de formato (no real): 5493411234567
   Tip: reemplazá también "5491155851032" en index.html (buscar y
   reemplazar) para que los enlaces funcionen aunque falle el JS.
----------------------------------------------------------- */
const WHATSAPP_NUMBER = "5491155851032";

/* -----------------------------------------------------------
   2) MENSAJES PRELLENADOS por ubicación del botón (data-wa)
   Se codifican automáticamente con encodeURIComponent.
----------------------------------------------------------- */
const WA_MESSAGES = {
  header:          "Hola Natalia, vi tu página y quiero asesoramiento sobre coberturas médicas.",
  flotante:        "Hola Natalia, vi tu página y quiero asesoramiento sobre coberturas médicas.",
  "barra-mobile":  "Hola Natalia, vi tu página y quiero asesoramiento sobre coberturas médicas.",
  footer:          "Hola Natalia, vi tu página y quiero asesoramiento sobre coberturas médicas.",
  hero:            "Hola Natalia, quiero que me ayudes a elegir una cobertura médica.",
  recibo:          "Hola Natalia, tengo recibo de sueldo y quiero saber a qué planes puedo derivar mis aportes.",
  monotributo:     "Hola Natalia, soy monotributista y quiero saber qué opciones de cobertura médica tengo.",
  familia:         "Hola Natalia, quiero cotizar una cobertura médica para mí y mi familia.",
  empresa:         "Hola Natalia, tengo una empresa y quiero cotizar cobertura médica para mi equipo.",
  problema:        "Hola Natalia, estoy con dudas para elegir cobertura médica y quiero contarte mi caso.",
  "como-funciona": "Hola Natalia, quiero empezar mi asesoramiento gratuito.",
  comparativa:     "Hola Natalia, quiero comparar planes de distintas prepagas y obras sociales.",
  tramites:        "Hola Natalia, quiero que me ayudes con el trámite de alta o derivación de aportes.",
  entidades:       "Hola Natalia, no sé qué prepaga u obra social me conviene. ¿Me ayudás a comparar?",
  natalia:         "Hola Natalia, leí sobre vos en tu página y quiero asesorarme.",
  testimonios:     "Hola Natalia, quiero asesorarme con vos para elegir mi cobertura médica.",
  zona:            "Hola Natalia, quiero saber qué coberturas médicas hay en mi zona. Vivo en: ",
  "faq-prepaga":   "Hola Natalia, ya tengo prepaga y quiero saber si me conviene cambiar.",
  faq:             "Hola Natalia, tengo una duda sobre coberturas médicas: ",
  cierre:          "Hola Natalia, quiero mi asesoramiento gratis para elegir cobertura médica."
};

const DEFAULT_MESSAGE = WA_MESSAGES.header;

function buildWaLink(key) {
  const text = WA_MESSAGES[key] || DEFAULT_MESSAGE;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/* -----------------------------------------------------------
   3) MEDICIÓN: GA4 (gtag o dataLayer/GTM) + Meta Pixel
----------------------------------------------------------- */
function track(eventName, params) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, params));
    if (typeof window.gtag === "function") window.gtag("event", eventName, params);
  } catch (e) { /* no-op */ }
}

function trackWhatsAppClick(location) {
  track("whatsapp_click", { cta_location: location, link_url: "wa.me" });
  try {
    if (typeof window.fbq === "function") window.fbq("track", "Contact", { content_name: location });
  } catch (e) { /* no-op */ }
}

/* -----------------------------------------------------------
   4) INICIALIZACIÓN
----------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // 4.1 Enlaces de WhatsApp
  document.querySelectorAll("[data-wa]").forEach((a) => {
    const key = a.getAttribute("data-wa");
    a.href = buildWaLink(key);
    a.target = "_blank";
    a.rel = "noopener";
    a.addEventListener("click", () => trackWhatsAppClick(key));
  });

  // 4.2 Año del footer
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // 4.3 Header con sombra al scrollear
  const header = document.querySelector(".site-header");
  const onScrollHeader = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  // 4.4 CTAs fijos: barra mobile + botón flotante
  const bar = document.getElementById("wa-bar");
  const float = document.getElementById("wa-float");
  const heroCta = document.getElementById("hero-cta");
  const finalCta = document.getElementById("final-cta");
  const state = { heroVisible: true, finalVisible: false, unlocked: false };

  const setVisible = (el, visible) => {
    if (!el) return;
    el.classList.toggle("visible", visible);
    el.setAttribute("aria-hidden", visible ? "false" : "true");
    el.querySelectorAll("a").forEach((a) => (visible ? a.removeAttribute("tabindex") : a.setAttribute("tabindex", "-1")));
  };

  const updateFixed = () => {
    // Se muestran cuando el CTA del hero ya no se ve y se ocultan en el CTA final (evita duplicar botones).
    const show = !state.heroVisible && !state.finalVisible;
    setVisible(bar, show);
    setVisible(float, show && state.unlocked);
  };

  if ("IntersectionObserver" in window) {
    if (heroCta) {
      new IntersectionObserver(([entry]) => { state.heroVisible = entry.isIntersecting; updateFixed(); }).observe(heroCta);
    }
    if (finalCta) {
      new IntersectionObserver(([entry]) => { state.finalVisible = entry.isIntersecting; updateFixed(); }, { threshold: 0.25 }).observe(finalCta);
    }
  } else {
    state.heroVisible = false;
  }

  // El flotante aparece tras 4 s o al pasar el 25% de scroll (lo que ocurra primero).
  const unlockFloat = () => { if (!state.unlocked) { state.unlocked = true; updateFixed(); scheduleTooltip(); } };
  setTimeout(unlockFloat, 4000);

  // Tooltip una sola vez por sesión, 3 s después de aparecer, visible 6 s.
  let tipShown = false;
  function scheduleTooltip() {
    if (tipShown || !float) return;
    try { if (sessionStorage.getItem("waTip")) return; } catch (e) { /* no-op */ }
    tipShown = true;
    setTimeout(() => {
      float.classList.add("show-tip");
      try { sessionStorage.setItem("waTip", "1"); } catch (e) { /* no-op */ }
      setTimeout(() => float.classList.remove("show-tip"), 6000);
    }, 3000);
  }

  // 4.5 Scroll depth (25/50/75/90) – una vez por umbral
  const marks = [25, 50, 75, 90];
  const reached = new Set();
  const onScrollDepth = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = Math.round((window.scrollY / max) * 100);
    if (pct >= 25) unlockFloat();
    marks.forEach((m) => {
      if (pct >= m && !reached.has(m)) { reached.add(m); track("scroll_depth", { percent: m }); }
    });
  };
  window.addEventListener("scroll", onScrollDepth, { passive: true });

  // 4.6 FAQ: medir qué preguntas se abren
  document.querySelectorAll(".faq-list details").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) {
        const q = d.querySelector("summary");
        track("faq_open", { question: q ? q.textContent.trim() : "" });
      }
    });
  });

  // 4.7 Aparición suave de bloques
  const reveal = document.querySelectorAll(".seg-card, .step, .info-card, .promise-grid li, .free-box, .table-wrap, .glossary");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveal.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
  }
});

