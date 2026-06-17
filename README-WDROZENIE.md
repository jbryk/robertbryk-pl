# Wdrożenie robertbryk.pl — krok po kroku

Strona jest gotowa do publikacji. Backend (formularz → baza → mail) jest **opcjonalny** —
możesz najpierw opublikować samą stronę (formularz działa wtedy przez `mailto:`), a Supabase/Resend
dołożyć później.

---

## ✅ Co już jest zrobione
- Kompletna strona w `strona/` (one-page: hero, o kancelarii, usługi, współpraca, kontakt + formularz).
- `polityka-prywatnosci.html` (RODO), `robots.txt`, `sitemap.xml`, `vercel.json`, favicon, dane strukturalne (JSON-LD).
- Gotowy backend w `backend/` (SQL + edge function) — do podpięcia, gdy zechcesz.

## ✏️ Dane uzupełnione (CEIDG + rejestr adwokatów)
NIP 8141273684, REGON 690686997, Izba Adwokacka w Krakowie (nr KRA/Adw/1937, od 1999), tel./fax 14 683 56 78 — wszystko wpisane. **Brak już placeholderów `[...]`.**
Opcjonalnie: ustaw stałe godziny przyjęć (teraz „po wcześniejszym umówieniu telefonicznym") i dodaj zdjęcie/grafikę OG (`_assets/img/og-image.jpg`).

---

## 1) Podgląd lokalny
```bash
cd "C:\Claude-projekty\Strona www\robertbryk.pl\strona"
python -m http.server 8080
# otwórz http://localhost:8080
```
> Uwaga: linki są bezwzględne (`/_assets/...`), więc otwieraj przez serwer (powyżej),
> a nie podwójnym kliknięciem pliku (file://).

## 2) Repo na GitHub
```bash
cd "C:\Claude-projekty\Strona www\robertbryk.pl\strona"
git init
git config user.email "biuro@unimaptech.pl"   # właściwa tożsamość
git config user.name  "Jerzy Bryk"
git add -A
git commit -m "Strona kancelarii robertbryk.pl"
gh repo create jbryk/robertbryk-pl --private --source=. --push
```
> Deployujemy **zawartość `strona/`** (nie cały projekt) — `backend/` zostaje poza repo strony.

## 3) Vercel
1. https://vercel.com → **New Project** → import repo z GitHub.
2. Framework Preset: **Other**. Root Directory: katalog repo (czyli `strona/`).
3. **Deploy** → dostajesz `robertbryk-pl-xxxx.vercel.app` — sprawdź, czy działa.

## 4) Domena robertbryk.pl + DNS na cyberfolks
W Vercel → Project → **Settings → Domains** → dodaj `robertbryk.pl` i `www.robertbryk.pl`.

W panelu **cyberfolks** (Strefa DNS domeny robertbryk.pl) ustaw rekordy A:

| Nazwa | Typ | Wartość |
|-------|-----|---------|
| `@`   | A   | `76.76.21.21` |
| `www` | A   | `76.76.21.21` (lub CNAME → `cname.vercel-dns.com`) |

### 🔴 Pułapki (z realnego wdrożenia)
- **Apex `@`**: rekord goły musi mieć w polu Nazwa dokładnie `@`. Wpisanie `robertbryk.pl` bez kropki potrafi rozwinąć się do `robertbryk.pl.robertbryk.pl` i domena nie zadziała (a `www` tak).
- **NIE ruszaj poczty**: zostaw rekordy **MX, SPF (TXT v=spf1…), DKIM (`*._domainkey`), DMARC (`_dmarc`)** i subdomeny `ftp/pop/smtp/mail`. Zmieniasz tylko `@` i `www`.
- **SSL „utknął"** mimo dobrego DNS → w Vercel wymuś świeży deploy produkcyjny: `vercel --prod --yes`.

### Weryfikacja (po ~15–60 min propagacji)
```bash
curl -s "https://dns.google/resolve?name=robertbryk.pl&type=A"
curl -s -o /dev/null -w "%{http_code}\n" https://www.robertbryk.pl/          # 200
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" https://robertbryk.pl/  # 308 -> www
```

---

## 5) (Opcjonalnie) Backend: zapis zgłoszeń + mail potwierdzający

### a) Supabase
1. https://supabase.com → **New project**. Zapisz **Project URL** i klucz **anon** (`sb_publishable_...`).
2. **SQL Editor** → New query → wklej `backend/supabase_setup.sql` → **Run**.
3. W `strona/_assets/js/kontakt.js` (góra pliku) wpisz:
   ```js
   const SUPABASE_URL  = "https://twoj-projekt.supabase.co";
   const SUPABASE_ANON = "sb_publishable_...";
   ```
   Po commitcie + pushu formularz przestanie używać `mailto:` i zacznie zapisywać do bazy.
4. Zgłoszenia podejrzysz w Supabase → **Table Editor → submissions_kontakt** (albo załóż konto w Authentication → Users do panelu).

### b) Resend + mail potwierdzający (wymaga domeny)
1. https://resend.com → klucz `re_...`. **Domains → Add Domain** → `robertbryk.pl` → dodaj wskazane rekordy **TXT (SPF, DKIM)** w cyberfolks (NIE ruszając poczty głównej). Poczekaj na **Verified**.
   > Jeśli na `robertbryk.pl` masz pocztę — w Resend zostaw „Enable Receiving" **OFF**.
2. Supabase → **Edge Functions → Secrets**:
   - `RESEND_API_KEY = re_...`
   - `FROM_EMAIL = Kancelaria Adwokacka Robert Bryk <kontakt@robertbryk.pl>` (adres z domeny zweryfikowanej w Resend)
3. Wgraj funkcję:
   ```bash
   supabase functions deploy send-confirmation
   ```
   (plik: `backend/edge-functions/send-confirmation.ts`)
4. Supabase → **Database → Webhooks → Create**: tabela `submissions_kontakt`, zdarzenie **INSERT**, akcja → wywołaj Edge Function `send-confirmation`.

### Test końcowy
Wyślij formularz testowy → sprawdź: (1) rekord w `submissions_kontakt`, (2) mail u nadawcy,
(3) Resend → Logs status „delivered". Jeśli „delivered", a maila brak — sprawdź SPAM i DMARC.

---

## Struktura projektu
```
robertbryk.pl/
├── CLAUDE.md                  ← instrukcje projektu
├── README-WDROZENIE.md        ← ten plik
├── strona/                    ← DEPLOY na Vercel (osobne repo git)
│   ├── index.html
│   ├── polityka-prywatnosci.html
│   ├── vercel.json
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── favicon.svg
│   └── _assets/{css,js,img}
└── backend/                   ← NIE deployowane (Supabase + Resend)
    ├── supabase_setup.sql
    └── edge-functions/send-confirmation.ts
```
