import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { canSendMail } from "../notifications/mailer";
import nodemailer from "nodemailer";
import { env } from "../config/env";

export const contactRouter = Router();

const SUPPORT_EMAIL = "suporte@licitabrasilweb.com.br";

function getTransporter() {
  const port = env.smtp.port;
  const isLocalMailpit = env.smtp.host === "mailpit" || port === 1025 || port === 25;
  return nodemailer.createTransport({
    host: env.smtp.host,
    port,
    secure: port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    tls: { rejectUnauthorized: !isLocalMailpit },
    ignoreTLS: port === 25 || port === 1025,
  });
}

contactRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, email, phone, subject, message } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Campos obrigatórios: nome, e-mail e mensagem." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ ok: false, error: "E-mail inválido." });
    }

    if (!canSendMail()) {
      return res.status(200).json({ ok: true, queued: false });
    }

    const subjectLine = subject?.trim() || "Contato via site – Licita Brasil Web";

    await getTransporter().sendMail({
      from: env.smtp.from,
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: subjectLine,
      text: `Nome: ${name}\nE-mail: ${email}\nTelefone: ${phone || "—"}\n\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:1.3rem;font-weight:800;color:#1e3a8a">Licita<strong>Brasil</strong><span style="font-size:.9rem;font-weight:600;color:#4b5563">Web</span></span>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:20px">
            <span style="font-weight:700;color:#1e3a8a">Nova mensagem de contato</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.92rem;margin-bottom:20px">
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 8px;color:#6b7280;width:110px">Nome</td>
              <td style="padding:10px 8px;font-weight:600;color:#111827">${name}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 8px;color:#6b7280">E-mail</td>
              <td style="padding:10px 8px;color:#111827"><a href="mailto:${email}" style="color:#1e3a8a">${email}</a></td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 8px;color:#6b7280">Telefone</td>
              <td style="padding:10px 8px;color:#111827">${phone || "—"}</td>
            </tr>
            <tr>
              <td style="padding:10px 8px;color:#6b7280">Assunto</td>
              <td style="padding:10px 8px;color:#111827">${subject || "—"}</td>
            </tr>
          </table>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:.93rem;color:#374151;white-space:pre-wrap">${message}</div>
          <p style="font-size:.78rem;color:#9ca3af;text-align:center;margin-top:24px">Mensagem enviada pelo formulário de contato em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
        </div>
      `,
    });

    return res.json({ ok: true });
  })
);
