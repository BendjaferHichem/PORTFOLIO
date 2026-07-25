import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Render sits behind a reverse proxy — this makes Express aware of that
// so req.ip and friends behave correctly.
app.set('trust proxy', 1);

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = process.env.CONTACT_TO_EMAIL;
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

// Allow the GitHub Pages frontend to call this API cross-origin.
// Update ALLOWED_ORIGIN below to match your actual GitHub Pages URL exactly
// (no trailing slash), e.g. 'https://mrobottt.github.io'.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://BendjaferHichem.github.io';

app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['POST'],
}));

app.use(express.json());

// Serve the static portfolio (index.html, style.css, script.js, race.html, assets/...)
// which lives one folder up from /server. Harmless to keep even though GitHub Pages
// is now the primary host — this just means the Render URL also serves the site directly.
app.use(express.static(path.join(__dirname, '..')));

/* ============================================
   Very small in-memory rate limiter
   5 submissions per IP per 10 minutes is plenty
   for a portfolio contact form and needs no extra deps.
   ============================================ */
const submissions = new Map(); // ip -> [timestamps]
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (submissions.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  submissions.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.post('/api/contact', async (req, res) => {
  try {
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress;

    if (isRateLimited(ip)) {
      return res
        .status(429)
        .json({ ok: false, error: 'Too many messages sent. Please try again in a few minutes.' });
    }

    const { name, email, message, company } = req.body || {};

    // Honeypot — a hidden field real visitors never fill in.
    // If it has a value, this is almost certainly a bot: pretend success, do nothing.
    if (company) {
      return res.status(200).json({ ok: true });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid name.' });
    }
    if (!email || typeof email !== 'string' || !emailPattern.test(email.trim())) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email.' });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ ok: false, error: 'Please write a short message.' });
    }
    if (!TO_EMAIL) {
      console.error('CONTACT_TO_EMAIL is not set — check your .env file.');
      return res.status(500).json({ ok: false, error: 'Server is not configured correctly.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    await resend.emails.send({
      from: `Portfolio Contact <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: cleanEmail,
      subject: `New message from ${cleanName}`,
      text: `From: ${cleanName} <${cleanEmail}>\n\n${cleanMessage}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a;">
          <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(cleanMessage).replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Something went wrong sending your message. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
});
