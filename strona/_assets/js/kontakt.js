/* =====================================================================
   kontakt.js — obsługa formularza kontaktowego (Web3Forms)
   ---------------------------------------------------------------------
   Formularz wysyła zgłoszenie przez Web3Forms — wiadomość trafia prosto
   na skrzynkę kancelarii (robert_bryk@go2.pl). Bez serwera i bazy.

   KONFIGURACJA (1 krok):
     1. Wejdź na https://web3forms.com → wpisz robert_bryk@go2.pl → "Create Access Key".
     2. Skopiuj otrzymany Access Key i wklej poniżej w ACCESS_KEY.
   Dopóki klucz nie jest wklejony, formularz działa w trybie awaryjnym (mailto).
   ===================================================================== */
(function () {
  "use strict";

  // ── KONFIGURACJA ──
  const ACCESS_KEY   = "24d7a976-28ad-4ced-9068-164f91ef8e34";   // Web3Forms (klucz publiczny — front)
  const FALLBACK_EMAIL = "robert_bryk@go2.pl";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const configured = ACCESS_KEY.indexOf("TWOJ-") === -1 && ACCESS_KEY.length > 16;

  const val = (sel) => (form.querySelector(sel)?.value || "").trim();

  function showMsg(text, type, isHtml) {
    let el = form.querySelector(".form-msg");
    if (!el) {
      el = document.createElement("div");
      el.className = "form-msg";
      el.setAttribute("role", "status");
      form.appendChild(el);
    }
    el.className = "form-msg " + type;
    if (isHtml) el.innerHTML = text; else el.textContent = text;
    if (type === "success") setTimeout(() => el.remove(), 12000);
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

    const data = {
      name:    val("#cf-name"),
      email:   val("#cf-email"),
      phone:   val("#cf-phone"),
      subject: val("#cf-subject"),
      message: val("#cf-message"),
    };
    const consent = form.querySelector("#cf-consent")?.checked;

    if (!data.name || !data.email || !data.message) {
      showMsg("Uzupełnij imię i nazwisko, e-mail oraz wiadomość.", "error"); return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
      showMsg("Podaj poprawny adres e-mail.", "error"); return;
    }
    if (!consent) {
      showMsg("Zaznacz zgodę na przetwarzanie danych.", "error"); return;
    }

    const btn = form.querySelector('[type="submit"]');

    // ── FALLBACK: brak klucza Web3Forms → otwórz pocztę ──
    if (!configured) {
      const link = buildMailto(data);
      window.location.href = link;
      showMsg(
        'Dokończ wysyłkę w swoim programie pocztowym (próbowaliśmy go otworzyć). ' +
        'Jeśli się nie otworzył, kliknij: <a href="' + link + '" style="color:inherit;text-decoration:underline;font-weight:700;">napisz na ' + FALLBACK_EMAIL + '</a>.',
        "success", true
      );
      return;
    }

    // ── WYSYŁKA przez Web3Forms ──
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Wysyłanie…"; }
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: "Nowe zapytanie ze strony robertbryk.pl",
          from_name: "Formularz robertbryk.pl",
          replyto: data.email,
          "Imię i nazwisko": data.name,
          "E-mail": data.email,
          "Telefon": data.phone || "—",
          "Temat sprawy": data.subject || "—",
          "Wiadomość": data.message,
        }),
      });
      const out = await res.json();
      if (out.success) {
        form.reset();
        showMsg("✓ Wiadomość wysłana. Odpowiem zwykle w ciągu 1–2 dni roboczych.", "success");
      } else {
        throw new Error(out.message || "błąd Web3Forms");
      }
    } catch (err) {
      console.error(err);
      showMsg('Nie udało się wysłać. Spróbuj ponownie lub napisz na <a href="mailto:' + FALLBACK_EMAIL + '" style="color:inherit;text-decoration:underline;font-weight:700;">' + FALLBACK_EMAIL + '</a>.', "error", true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Wyślij wiadomość"; }
    }
  });

})();
