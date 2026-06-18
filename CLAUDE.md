# Projekt: robertbryk.pl — strona Kancelarii Adwokackiej Robert Bryk

## Cel
Statyczna strona-wizytówka (one-page) kancelarii adwokackiej **adw. Roberta Bryka** (Dębica),
hostowana na **Vercel**, z formularzem kontaktowym. Backend (Supabase + Resend) opcjonalny —
do zapisu zgłoszeń i automatycznego potwierdzenia mailem.

## Architektura
- **Frontend**: statyczny HTML/CSS/JS, bez frameworka. Katalog deployowany: `strona/`.
- **Formularz kontaktowy → e-mail przez Web3Forms** (wybrane 2026-06-17): `_assets/js/kontakt.js` wysyła zgłoszenie POST-em do Web3Forms, mail trafia na `robert_bryk@go2.pl`. Wymaga wklejenia `ACCESS_KEY` (z web3forms.com) w `kontakt.js`. Dopóki klucza brak → **fallback `mailto:`**.
- **Uwaga:** był bug — ukryty honeypot `name="company"` był autouzupełniany przez przeglądarkę i po cichu blokował wysyłkę. Usunięty 2026-06-17.
- Pliki `backend/` (Supabase SQL + Resend Edge Function) — **alternatywa nieużywana** przy wariancie Web3Forms; zostają na wypadek rozbudowy. NIE są deployowane.

## Dane kancelarii (zweryfikowane: CEIDG + rejestr adwokatów, 2026-06-17)
- Nazwa: **Kancelaria Adwokacka adw. Robert Bryk**
- Adres: ul. Kraszewskiego 5, 39-200 **Dębica**
- Telefon kom.: **603 674 185** (`tel:+48603674185`); tel./fax: **14 683 56 78**
- E-mail: **robert_bryk@go2.pl**
- **NIP 8141273684**, **REGON 690686997**, działalność od 2000 (PKD 69.10.Z)
- Adwokat **Izby Adwokackiej w Krakowie**, nr wpisu **KRA/Adw/1937**, na liście od **1999-10-29** (wykonujący zawód)
- Praktyka ogólna (sprawy cywilne, rodzinne, spadkowe, karne)
- Domena: **robertbryk.pl** (zarejestrowana na **cyberfolks**)

## Pozostałe (opcjonalne) do dograania
- **Godziny przyjęć** — obecnie „po wcześniejszym umówieniu telefonicznym" (jeśli są stałe, podmienić w sekcji Kontakt).
- Zdjęcie adwokata i grafika OG (`strona/_assets/img/og-image.jpg`).

## Żelazne zasady (bezpieczeństwo)
- Front używa **wyłącznie** klucza Supabase `sb_publishable_...` (anon). Nigdy `service_role`/`sb_secret_` we froncie.
- Klucz Resend `re_...` tylko w sekretach Supabase (Edge Functions). Nigdy w repo/froncie.
- Katalog `backend/` trzymamy poza deployem (Root Directory na Vercel = `strona/`).

## DNS (cyberfolks) — skrót, szczegóły w README-WDROZENIE.md
- `@ A 76.76.21.21` (apex MUSI mieć Nazwę `@`!), `www A 76.76.21.21` (lub CNAME `cname.vercel-dns.com`).
- **NIE ruszać** rekordów poczty: MX, SPF (TXT v=spf1), DKIM, DMARC.

## Styl komunikacji
- Po polsku, konkretnie. Treść strony zgodna z etyką adwokacką: rzeczowa informacja zawodowa,
  bez obietnic wyników, bez superlatyw i porównań z innymi.
- Sukces raportuj zwrotem **„Kochamy Jurku"**.
