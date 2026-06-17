// ============================================================
// Edge Function: send-confirmation
// Wysyła klientowi potwierdzenie po wysłaniu formularza kontaktowego.
// Wyzwalane przez Database Webhook (INSERT na submissions_kontakt).
//
// Sekrety (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY = re_xxxxxxxx            (klucz z resend.com)
//   FROM_EMAIL     = Kancelaria Adwokacka Robert Bryk <kontakt@robertbryk.pl>
//                    (adres MUSI być z domeny zweryfikowanej w Resend)
// ============================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ??
  "Kancelaria Adwokacka Robert Bryk <kontakt@robertbryk.pl>";

// ── Marka ──
const C = {
  navy: "#14253b",
  gold: "#b08d57",
  cream: "#f7f4ee",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emailHtml(rec: Record<string, unknown>): string {
  const name = (rec.name as string) || "";
  const greeting = name && name !== "Anonim" ? `Szanowny/a ${esc(name)},` : "Dzień dobry,";
  const msg = (rec.message as string) || "";
  return `<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef0f3;font-family:'Segoe UI',Arial,sans-serif;color:#20262e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(20,37,59,.10);">
        <tr><td style="background:${C.navy};padding:26px 32px;color:#fff;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:${C.gold};width:42px;height:42px;border-radius:8px;text-align:center;vertical-align:middle;color:#fff;font-weight:700;font-size:17px;">RB</td>
            <td style="padding-left:12px;font-weight:700;font-size:16px;">Kancelaria Adwokacka<br><span style="font-weight:400;font-size:12px;color:rgba(255,255,255,.6);">adwokat Robert Bryk</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="height:3px;background:${C.gold};"></td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:${C.navy};">Otrzymałem Twoją wiadomość</h1>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.65;">${greeting}</p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.65;">
            dziękuję za kontakt z kancelarią. Zapoznam się z Twoją sprawą i odpowiem
            najszybciej, jak to możliwe — zwykle w ciągu 1–2 dni roboczych.
          </p>
          ${msg ? `
          <div style="margin:0 0 18px;padding:14px 18px;background:${C.cream};border-left:4px solid ${C.gold};border-radius:6px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${C.gold};text-transform:uppercase;letter-spacing:.5px;">Treść Twojej wiadomości:</p>
            <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(msg)}</p>
          </div>` : ""}
          <p style="margin:0;font-size:15px;line-height:1.65;">
            W pilnych sprawach proszę o kontakt telefoniczny:
            <a href="tel:+48603674185" style="color:${C.gold};text-decoration:none;font-weight:600;">603 674 185</a>.
          </p>
        </td></tr>
        <tr><td style="background:#f7f7f5;padding:20px 32px;border-top:1px solid #e7e3da;">
          <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
            <strong style="color:${C.navy};">Kancelaria Adwokacka Robert Bryk</strong><br>
            ul. Kraszewskiego 5, 39-200 Dębica<br>
            <a href="mailto:robert_bryk@go2.pl" style="color:${C.gold};text-decoration:none;">robert_bryk@go2.pl</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:14px 0 0;font-size:11px;color:#9aa1ab;">Wiadomość wygenerowana automatycznie po wysłaniu formularza na stronie robertbryk.pl.</p>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const table = payload.table as string;
    const rec = (payload.record ?? {}) as Record<string, unknown>;
    const to = (rec.email as string) || "";

    if (table !== "submissions_kontakt" || !to) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: "Otrzymałem Twoją wiadomość — Kancelaria Adwokacka Robert Bryk",
        html: emailHtml(rec),
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
