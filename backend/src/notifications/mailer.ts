import nodemailer from "nodemailer";
import { env } from "../config/env";

const isLocalMailpit = env.smtp.host === "mailpit" || env.smtp.port === 1025 || env.smtp.port === 25;

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export function canSendMail(): boolean {
  return !!(env.smtp.host && env.smtp.from);
}

function getTransporter() {
  if (!transporter) {
    const port = env.smtp.port;
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port,
      secure: port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      tls: { rejectUnauthorized: !isLocalMailpit },
      // Porta 25 e 1025 (Mailpit) não usam STARTTLS
      ignoreTLS: port === 25 || port === 1025,
    });
  }
  return transporter;
}

export async function sendEmailVerificationCode(opts: {
  to: string;
  code: string;
}): Promise<boolean> {
  if (!canSendMail()) return false;
  try {
    await getTransporter().sendMail({
      from: env.smtp.from,
      to: opts.to,
      subject: "Código de verificação – Licita Brasil Web",
      text: `Seu código de verificação é: ${opts.code}\nEle expira em 5 minutos.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
          <div style="text-align:center;margin-bottom:28px">
            <span style="font-size:1.3rem;font-weight:800;color:#1e3a8a">Licita<strong>Brasil</strong><span style="font-size:.9rem;font-weight:600;color:#4b5563">Web</span></span>
          </div>
          <h2 style="font-size:1.2rem;font-weight:700;color:#111827;margin:0 0 8px">Verificação de e-mail</h2>
          <p style="color:#6b7280;font-size:.95rem;margin:0 0 28px">Use o código abaixo para confirmar seu endereço de e-mail. Ele expira em <strong>5 minutos</strong>.</p>
          <div style="text-align:center;margin:0 0 28px">
            <span style="display:inline-block;font-size:2.2rem;font-weight:800;letter-spacing:12px;color:#1e3a8a;background:#eff6ff;padding:16px 24px;border-radius:10px;border:2px dashed #bfdbfe">${opts.code}</span>
          </div>
          <p style="font-size:.8rem;color:#9ca3af;text-align:center;margin:0">Se você não solicitou este código, ignore este e-mail.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("sendEmailVerificationCode error:", err);
    return false;
  }
}

export async function sendNewUserRegistrationNotification(opts: {
  adminEmail: string;
  userName: string;
  userEmail: string;
  userCpf?: string;
  registeredAt: Date;
}): Promise<boolean> {
  if (!canSendMail()) return false;
  const dateStr = opts.registeredAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  try {
    await getTransporter().sendMail({
      from: env.smtp.from,
      to: opts.adminEmail,
      subject: "Novo cadastro aguardando aprovação – Licita Brasil Web",
      text: `Novo usuário aguardando aprovação:\nNome: ${opts.userName}\nE-mail: ${opts.userEmail}\nCPF: ${opts.userCpf ?? "—"}\nData: ${dateStr}\n\nAcesse o painel administrativo para aprovar ou rejeitar o cadastro.`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:1.3rem;font-weight:800;color:#1e3a8a">Licita<strong>Brasil</strong><span style="font-size:.9rem;font-weight:600;color:#4b5563">Web</span></span>
          </div>
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
            <span style="font-size:1.4rem">⏳</span>
            <span style="font-weight:700;color:#92400e">Novo cadastro aguardando aprovação</span>
          </div>
          <p style="color:#374151;font-size:.95rem;margin:0 0 20px">Um novo usuário concluiu o cadastro na plataforma e está aguardando sua aprovação para acessar o sistema.</p>
          <table style="width:100%;border-collapse:collapse;font-size:.9rem;margin-bottom:24px">
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 8px;color:#6b7280;width:100px">Nome</td>
              <td style="padding:10px 8px;font-weight:600;color:#111827">${opts.userName}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 8px;color:#6b7280">E-mail</td>
              <td style="padding:10px 8px;font-weight:600;color:#111827">${opts.userEmail}</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 8px;color:#6b7280">CPF</td>
              <td style="padding:10px 8px;color:#111827">${opts.userCpf ?? "—"}</td>
            </tr>
            <tr>
              <td style="padding:10px 8px;color:#6b7280">Cadastrado em</td>
              <td style="padding:10px 8px;color:#111827">${dateStr}</td>
            </tr>
          </table>
          <div style="text-align:center">
            <a href="${env.app.publicUrl}/admin" style="display:inline-block;background:#2c3f31;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:.95rem">Acessar Painel de Aprovações</a>
          </div>
          <p style="font-size:.78rem;color:#9ca3af;text-align:center;margin-top:24px">Este e-mail foi gerado automaticamente pela plataforma Licita Brasil Web.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("sendNewUserRegistrationNotification error:", err);
    return false;
  }
}

export async function sendRegistrationConfirmationToUser(opts: {
  to: string;
  userName: string;
}): Promise<boolean> {
  if (!canSendMail()) return false;
  try {
    await getTransporter().sendMail({
      from: env.smtp.from,
      to: opts.to,
      subject: "Cadastro recebido – Licita Brasil Web",
      text: `Olá, ${opts.userName}!\n\nSeu cadastro foi recebido com sucesso e está em análise.\nVocê receberá uma notificação neste e-mail assim que seu acesso for liberado.\n\nEquipe Licita Brasil Web`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:1.3rem;font-weight:800;color:#1e3a8a">Licita<strong>Brasil</strong><span style="font-size:.9rem;font-weight:600;color:#4b5563">Web</span></span>
          </div>
          <h2 style="font-size:1.15rem;font-weight:700;color:#111827;margin:0 0 12px">Cadastro recebido com sucesso!</h2>
          <p style="color:#374151;font-size:.95rem;line-height:1.6;margin:0 0 16px">Olá, <strong>${opts.userName}</strong>!</p>
          <p style="color:#374151;font-size:.95rem;line-height:1.6;margin:0 0 16px">Seu cadastro foi recebido e está sendo <strong>analisado</strong> pela nossa equipe. Assim que sua conta for aprovada, você receberá uma notificação neste endereço de e-mail.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-bottom:24px">
            <p style="margin:0;font-size:.88rem;color:#166534">Em caso de dúvidas, entre em contato com o suporte da plataforma.</p>
          </div>
          <p style="font-size:.78rem;color:#9ca3af;text-align:center;margin:0">Este e-mail foi gerado automaticamente pela plataforma Licita Brasil Web.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("sendRegistrationConfirmationToUser error:", err);
    return false;
  }
}

export async function sendAccountApprovedEmail(opts: {
  to: string;
  userName: string;
}): Promise<boolean> {
  if (!canSendMail()) return false;
  try {
    await getTransporter().sendMail({
      from: env.smtp.from,
      to: opts.to,
      subject: "Cadastro aprovado – Licita Brasil Web",
      text: `Olá, ${opts.userName}!\n\nSeu cadastro foi aprovado! Você já pode acessar a plataforma Licita Brasil Web.\n\nAcesse: ${env.app.publicUrl}\n\nEquipe Licita Brasil Web`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:1.3rem;font-weight:800;color:#1e3a8a">Licita<strong>Brasil</strong><span style="font-size:.9rem;font-weight:600;color:#4b5563">Web</span></span>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
            <span style="font-size:1.4rem">✅</span>
            <span style="font-weight:700;color:#166534">Cadastro aprovado!</span>
          </div>
          <p style="color:#374151;font-size:.95rem;line-height:1.6;margin:0 0 16px">Olá, <strong>${opts.userName}</strong>!</p>
          <p style="color:#374151;font-size:.95rem;line-height:1.6;margin:0 0 24px">Seu cadastro na plataforma <strong>Licita Brasil Web</strong> foi <strong>aprovado</strong>. Você já pode acessar o sistema com seu e-mail e senha cadastrados.</p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${env.app.publicUrl}/login" style="display:inline-block;background:#2c3f31;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:.95rem">Acessar a plataforma</a>
          </div>
          <p style="font-size:.78rem;color:#9ca3af;text-align:center;margin:0">Este e-mail foi gerado automaticamente pela plataforma Licita Brasil Web.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("sendAccountApprovedEmail error:", err);
    return false;
  }
}

export async function sendPasswordRecoveryEmail(opts: {
  to: string;
  cpfNormalized: string;
  link: string;
  expiresAt: Date;
}): Promise<boolean> {
  if (!canSendMail()) return false;
  try {
    await getTransporter().sendMail({
      from: env.smtp.from,
      to: opts.to,
      subject: "Recuperação de senha – Licita Brasil Web",
      text: `Acesse o link para redefinir sua senha: ${opts.link}\nExpira em: ${opts.expiresAt.toISOString()}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#2c3f31">Recuperação de senha</h2>
          <p>CPF informado: ${opts.cpfNormalized}</p>
          <p><a href="${opts.link}" style="background:#2c3f31;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">Redefinir senha</a></p>
          <p>Ou copie: <small>${opts.link}</small></p>
          <p>Expira em: ${opts.expiresAt.toLocaleString("pt-BR")}</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("sendPasswordRecoveryEmail error:", err);
    return false;
  }
}
