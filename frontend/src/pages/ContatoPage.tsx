import { useState } from "react";
import { Link } from "react-router-dom";
import "../landing.css";

const WHATSAPP_NUMBER = "5531982667628";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const SUPPORT_EMAIL = "suporte@licitabrasilweb.com.br";

export default function ContatoPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao enviar mensagem.");
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar mensagem. Tente novamente.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e3a8a" }}>
            Licita<strong>Brasil</strong><span style={{ fontSize: ".85rem", fontWeight: 600, color: "#4b5563" }}>Web</span>
          </span>
        </Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link to="/" style={{ color: "#374151", textDecoration: "none", fontSize: ".9rem" }}>← Voltar ao início</Link>
          <Link to="/login" style={{ background: "#2c3f31", color: "#fff", padding: "8px 18px", borderRadius: 8, textDecoration: "none", fontSize: ".9rem", fontWeight: 600 }}>Entrar</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2c3f31 100%)", color: "#fff", padding: "56px 24px 48px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, margin: "0 0 12px" }}>Fale com nossos Especialistas</h1>
        <p style={{ fontSize: "1.05rem", opacity: 0.88, margin: 0 }}>Estamos prontos para ajudar você em cada etapa do processo licitatório.</p>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

        {/* Informações de contato */}
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: 24 }}>Canais de atendimento</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* E-mail */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e5e7eb", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MailIcon />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>E-mail de Suporte</div>
                <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#1e3a8a", textDecoration: "none", fontSize: ".95rem", fontWeight: 600 }}>{SUPPORT_EMAIL}</a>
                <div style={{ color: "#6b7280", fontSize: ".83rem", marginTop: 4 }}>Respondemos em até 24 horas úteis</div>
              </div>
            </div>

            {/* WhatsApp */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e5e7eb", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <WhatsAppIcon />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>WhatsApp</div>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#166534", textDecoration: "none", fontSize: ".95rem", fontWeight: 600 }}>(31) 98266-7628</a>
                <div style={{ color: "#6b7280", fontSize: ".83rem", marginTop: 4 }}>Atendimento rápido pelo WhatsApp</div>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: "#25d366", color: "#fff", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontSize: ".88rem", fontWeight: 600 }}
                >
                  <WhatsAppIcon small /> Abrir WhatsApp
                </a>
              </div>
            </div>

            {/* Horário */}
            <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e5e7eb", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ClockIcon />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>Horário de Atendimento</div>
                <div style={{ color: "#374151", fontSize: ".92rem" }}>Segunda a Sexta: 8h às 18h</div>
                <div style={{ color: "#6b7280", fontSize: ".83rem", marginTop: 2 }}>Suporte urgente disponível 24/7</div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "32px", border: "1px solid #e5e7eb", boxShadow: "0 4px 24px rgba(0,0,0,.06)" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", marginBottom: 24 }}>Envie uma mensagem</h2>

          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 3 + "rem", marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#166534", marginBottom: 8 }}>Mensagem enviada!</div>
              <div style={{ color: "#374151", fontSize: ".93rem", marginBottom: 24 }}>
                Nossa equipe entrará em contato em breve pelo e-mail informado.
              </div>
              <button
                onClick={() => setStatus("idle")}
                style={{ background: "#2c3f31", color: "#fff", padding: "10px 24px", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: ".93rem" }}
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Nome completo *</label>
                  <input name="name" value={form.name} onChange={handleChange} required placeholder="Seu nome" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>E-mail *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="seu@email.com" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Telefone / WhatsApp</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="(31) 00000-0000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Assunto</label>
                  <select name="subject" value={form.subject} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">Selecione...</option>
                    <option>Dúvida sobre a plataforma</option>
                    <option>Suporte técnico</option>
                    <option>Pregão Eletrônico</option>
                    <option>Dispensa Eletrônica</option>
                    <option>Cadastro de órgão</option>
                    <option>Cadastro de fornecedor</option>
                    <option>Comercial / Planos</option>
                    <option>Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Mensagem *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Descreva sua dúvida ou necessidade..."
                  style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
                />
              </div>

              {status === "error" && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: ".88rem" }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  background: status === "sending" ? "#9ca3af" : "#2c3f31",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 24px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: status === "sending" ? "not-allowed" : "pointer",
                  transition: "background .2s",
                }}
              >
                {status === "sending" ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer mínimo */}
      <footer style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: ".83rem", borderTop: "1px solid #e5e7eb" }}>
        © {new Date().getFullYear()} Licita Brasil Web. Todos os direitos reservados.
      </footer>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: ".85rem",
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: ".93rem",
  color: "#111827",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

function MailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  );
}

function WhatsAppIcon({ small }: { small?: boolean }) {
  const size = small ? 16 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={small ? "#fff" : "#25d366"}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
