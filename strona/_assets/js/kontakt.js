/* =====================================================================
   kontakt.js — obsługa formularza kontaktowego
   ---------------------------------------------------------------------
   Dwa tryby działania:
   1) BACKEND (docelowo): jeśli uzupełnisz SUPABASE_URL i SUPABASE_ANON,
      zgłoszenie trafia do tabeli `submissions_kontakt` w Supabase,
      a Webhook + Edge Function wysyła klientowi potwierdzenie (Resend).
   2) FALLBACK (od razu po publikacji): dopóki Supabase nie jest
      skonfigurowane, formularz otwiera program pocztowy z gotową treścią
      na adres kancelarii — strona jest użyteczna natychmiast.

   KONFIGURACJA: uzupełnij dwie wartości poniżej (z Supabase → Settings → API).
   Klucz `sb_publishable_...` (anon) jest bezpieczny do umieszczenia we froncie.
   ===================================================================== */
(function () {
  "use strict";

  // ── KONFIGURACJA ──
  const SUPABASE_URL  = "https://TWOJ-PROJEKT.supabase.co";   // ← podmień
  const SUPABASE_ANON = "sb_publishable_XXXXXXXXXXXX";          // ← podmień (anon)
  const FALLBACK_EMAIL = "robert_bryk@go2.pl";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const configured =
    SUPABASE_URL.indexOf("TWOJ-PROJEKT") === -1 &&
    SUPABASE_ANON.indexOf("XXXX") === -1;

  const val = (sel) => (form.querySelector(sel)?.value || "").trim();

  function showMsg(text, type) {
    let el = form.querySelector(".form-msg");
    if (!el) {
      el = document.createElement("div");
      el.className = "form-msg";
      el.setAttribute("role", "status");
      form.appendChild(el);
    }
    el.className = "form-msg " + type;
    el.textContent = text;
    if (type === "success") setTimeout(() => el.remove(), 8000);
  }

  // Leniwe ładowanie SDK Supabase tylko gdy backend skonfigurowany
  let dbPromise = null;
  function getDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (window.supabase) return resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON));
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
      s.onload = () => resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON));
      s.onerror = () => reject(new Error("Nie udało się załadować Supabase SDK"));
      document.head.appendChild(s);
    });
    return dbPromise;
  }

  function buildMailto(data) {
    const subject = "Zapytanie ze strony: " + (data.subject || "kontakt");
    const body =
      "Imię i nazwisko: " + data.name + "\n" +
      "E-mail: " + data.email + "\n" +
      "Telefon: " + (data.phone || "—") + "\n" +
      "Temat: " + (data.subject || "—") + "\n\n" +
      data.message + "\n";
    return "mailto:" + FALLBACK_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Honeypot — boty wypełniają ukryte pole "company"
    if (val('input[name="company"]')) return;

    const data = {
      name:    val("#cf-name"),
      email:   val("#cf-email"),
      phone:   val("#cf-phone"),
      subject: val("#cf-subject"),
      message: val("#cf-message"),
    };
    const consent = form.querySelector("#cf-consent")?.checked;

    if (!data.name || !data.email || !data.message) {
      showMsg("Uzupełnij imię i nazwisko, e-mail oraz wiadomość.", "error");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      showMsg("Podaj poprawny adres e-mail.", "error");
      return;
    }
    if (!consent) {
      showMsg("Zaznacz zgodę na przetwarzanie danych.", "error");
      return;
    }

    const btn = form.querySelector('[type="submit"]');

    // ── FALLBACK: brak skonfigurowanego backendu → otwórz pocztę ──
    if (!configured) {
      window.location.href = buildMailto(data);
      showMsg("Otworzyliśmy Twój program pocztowy z gotową wiadomością. Jeśli się nie otworzył, napisz na " + FALLBACK_EMAIL + ".", "success");
      return;
    }

    // ── BACKEND: zapis do Supabase ──
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Wysyłanie…"; }
    try {
      const db = await getDb();
      const { error } = await db.from("submissions_kontakt").insert({
        name:    data.name,
        email:   data.email,
        phone:   data.phone || null,
        subject: data.subject || null,
        message: data.message,
        status:  "new",
      });
      if (error) throw error;
      form.reset();
      showMsg("✓ Wiadomość wysłana. Odpowiem zwykle w ciągu 1–2 dni roboczych.", "success");
    } catch (err) {
      console.error(err);
      showMsg("Nie udało się wysłać. Spróbuj ponownie lub napisz na " + FALLBACK_EMAIL + ".", "error");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Wyślij wiadomość"; }
    }
  });

})();
