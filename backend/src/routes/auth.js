import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { query } from "../db/client.js";

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /auth/send-link
// Body: { email }
// Creates or finds a user, generates a magic link, sends it via email
router.post("/send-link", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Closed beta check
    if (process.env.CLOSED_BETA !== "false") {
      const allowed = await query(
        `SELECT 1 FROM allowed_emails WHERE email = $1`,
        [normalizedEmail],
      );
      if (allowed.rows.length === 0) {
        return res.status(403).json({ error: "not_in_beta" });
      }
    }

    // Upsert user
    const userResult = await query(
      `INSERT INTO users (email) VALUES ($1)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id, email`,
      [normalizedEmail]
    );
    const user = userResult.rows[0];

    // Generate token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await query(
      `INSERT INTO magic_links (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    const verifyUrl = `${apiUrl}/auth/verify?token=${rawToken}`;

    // Send email
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: normalizedEmail,
      subject: "Your ESV Threshold login link",
      html: `
        <div style="font-family: monospace; background: #04050a; color: #d8e8f2; padding: 40px; max-width: 480px; margin: 0 auto;">
          <div style="color: #1aadad; font-size: 12px; letter-spacing: 4px; margin-bottom: 8px;">VANTAGE DEEP EXPLORATION</div>
          <h1 style="color: #22c8b8; font-size: 22px; margin: 0 0 24px; letter-spacing: 2px;">ESV THRESHOLD</h1>
          <p style="color: #8aa0b0; line-height: 1.7; margin: 0 0 24px;">
            Authorization request received. Click the link below to access your mission logs.
            This link expires in 15 minutes and can only be used once.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background: #1aadad; color: #04050a; text-decoration: none; padding: 14px 28px; font-weight: bold; letter-spacing: 2px; font-size: 13px;">
            ACCESS THRESHOLD →
          </a>
          <p style="color: #3d5060; font-size: 11px; margin: 24px 0 0;">
            If you didn't request this, you can safely ignore it.
          </p>
        </div>
      `,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("send-link error:", err);
    res.status(500).json({ error: "Failed to send login email" });
  }
});

// GET /auth/verify?token=...
// Validates the magic link token, sets session cookie, redirects to app
router.get("/verify", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_token`);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    // Find valid, unused, unexpired token
    const result = await query(
      `SELECT ml.id, ml.user_id, ml.expires_at, ml.used_at, u.email
       FROM magic_links ml
       JOIN users u ON u.id = ml.user_id
       WHERE ml.token_hash = $1`,
      [tokenHash]
    );

    const link = result.rows[0];

    if (!link) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_token`);
    }
    if (link.used_at) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_used`);
    }
    if (new Date(link.expires_at) < new Date()) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_expired`);
    }

    // Mark token as used
    await query(`UPDATE magic_links SET used_at = NOW() WHERE id = $1`, [link.id]);

    // Issue session JWT (30 days)
    const sessionToken = jwt.sign(
      { userId: link.user_id, email: link.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (err) {
    console.error("verify error:", err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
});

// POST /auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie("session");
  res.json({ ok: true });
});

// GET /auth/me — returns current user if session is valid
router.get("/me", async (req, res) => {
  const token = req.cookies?.session;
  if (!token) return res.json({ user: null });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: { id: payload.userId, email: payload.email } });
  } catch {
    res.json({ user: null });
  }
});

export default router;
