import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../landing.css";


export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Fade-up observer */
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("anim-fade-up");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".profile-card,.feature-card,.step,.testimonial-card,.news-card").forEach((el, i) => {
      (el as HTMLElement).style.animationDelay = `${(i % 4) * 0.1}s`;
      el.classList.add("observe-anim");
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* ======================================================= HEADER */}
      <header className={`header${scrolled ? " scrolled" : ""}`}>
        <div className="container header__inner">
          <a href="/" className="logo">
            <span className="logo__icon">⚖</span>
            <span className="logo__text">Licita<strong>Brasil</strong><span className="logo__tag">Web</span></span>
          </a>

          <nav className={`nav${navOpen ? " open" : ""}`}>
            <ul className="nav__list">
              <li className="nav__item nav__item--dropdown">
                <button className="nav__link nav__link--btn">
                  Comprador <ChevronIcon />
                </button>
                <div className="dropdown">
                  <a href="#perfis" className="dropdown__item">Órgãos Públicos</a>
                  <a href="#perfis" className="dropdown__item">Empresas Estatais</a>
                  <a href="#perfis" className="dropdown__item">Sistema S</a>
                </div>
              </li>
              <li className="nav__item"><a href="#perfis" className="nav__link">Fornecedor</a></li>
              <li className="nav__item nav__item--dropdown">
                <button className="nav__link nav__link--btn">
                  Serviços <ChevronIcon />
                </button>
                <div className="dropdown">
                  <a href="#" className="dropdown__item">Pregão Eletrônico</a>
                  <a href="#" className="dropdown__item">Dispensa Eletrônica</a>
                  <a href="#" className="dropdown__item">Credenciamento</a>
                  <a href="#" className="dropdown__item">Cotação Eletrônica</a>
                </div>
              </li>
              <li className="nav__item"><a href="#sobre" className="nav__link">Sobre</a></li>
              <li className="nav__item"><a href="#busca" className="nav__link">Licitações</a></li>
            </ul>
          </nav>

          <div className="header__actions">
            <Link to="/cadastro" className="btn btn--ghost">Cadastrar</Link>
            <Link to="/login" className="btn btn--primary">Acessar Plataforma</Link>
          </div>

          <button
            className="hamburger"
            aria-label="Abrir menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(!navOpen)}
          >
            <span style={navOpen ? { transform: "rotate(45deg) translate(5px,5px)" } : {}} />
            <span style={navOpen ? { opacity: 0 } : {}} />
            <span style={navOpen ? { transform: "rotate(-45deg) translate(5px,-5px)" } : {}} />
          </button>
        </div>
      </header>

      {/* ======================================================= HERO */}
      <section className="hero" id="inicio">
        <div className="hero__bg-shapes">
          <div className="shape shape--1" /><div className="shape shape--2" /><div className="shape shape--3" />
        </div>
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="badge badge--blue">Nova Lei 14.133/2021 — Estamos preparados</span>
            <h1 className="hero__title">
              a <strong>plataforma de licitações</strong><br />
              mais completa do Brasil
            </h1>
            <p className="hero__subtitle">
              Conectamos órgãos públicos a fornecedores de produtos e serviços com tecnologia de ponta, total transparência e suporte especializado em cada etapa do processo.
            </p>
            <div className="hero__actions">
              <Link to="/cadastro" className="btn btn--primary btn--lg">Cadastrar Gratuitamente</Link>
              <a href="#busca" className="btn btn--outline btn--lg">
                <SearchIcon /> Pesquisar Licitações
              </a>
            </div>
            <div className="hero__trust">
              <span className="trust-item"><CheckIcon className="trust-icon" /> Homologado pelo TCU</span>
              <span className="trust-item"><CheckIcon className="trust-icon" /> Conforme LGPD</span>
              <span className="trust-item"><CheckIcon className="trust-icon" /> Suporte 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= PERFIS */}
      <section className="profiles section" id="perfis">
        <div className="container">
          <div className="section-header">
            <span className="badge badge--light">Para todos os perfis</span>
            <h2 className="section-title">Uma plataforma completa para<br /><strong>cada parte do processo</strong></h2>
            <p className="section-subtitle">Seja você comprador, fornecedor ou cidadão, temos a solução ideal para suas necessidades.</p>
          </div>
          <div className="profiles__grid">
            <div className="profile-card profile-card--blue">
              <div className="profile-card__icon">
                <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#1B4FD8" fillOpacity=".15"/><path d="M24 14C18.477 14 14 18.477 14 24s4.477 10 10 10 10-4.477 10-10S29.523 14 24 14zm0 2a8 8 0 110 16 8 8 0 010-16z" fill="#1B4FD8"/><path d="M20 24h8M24 20v8" stroke="#1B4FD8" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <h3 className="profile-card__title">Comprador</h3>
              <p className="profile-card__desc">Simplifique seus processos licitatórios com ferramentas automáticas, relatórios inteligentes e suporte especializado da Nova Lei 14.133.</p>
              <ul className="profile-card__list">
                <li>Pregão Eletrônico integrado</li>
                <li>Gestão de contratos digital</li>
                <li>Relatórios automáticos de conformidade</li>
                <li>Publicação no PNCP automática</li>
              </ul>
              <a href="#" className="btn btn--primary btn--sm">Sou Comprador</a>
            </div>
            <div className="profile-card profile-card--green">
              <div className="profile-card__icon">
                <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#059669" fillOpacity=".15"/><path d="M16 30V22a2 2 0 012-2h12a2 2 0 012 2v8" stroke="#059669" strokeWidth="2" strokeLinecap="round"/><path d="M12 30h24M20 20v-4a4 4 0 018 0v4" stroke="#059669" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <h3 className="profile-card__title">Fornecedor</h3>
              <p className="profile-card__desc">Encontre oportunidades de negócio com o governo, gerencie propostas e acompanhe licitações em todo o território nacional.</p>
              <ul className="profile-card__list">
                <li>Alertas de licitações por segmento</li>
                <li>Gestão de propostas online</li>
                <li>Certificado digital integrado</li>
                <li>Relatório de desempenho</li>
              </ul>
              <a href="#" className="btn btn--success btn--sm">Sou Fornecedor</a>
            </div>
            <div className="profile-card profile-card--purple">
              <div className="profile-card__icon">
                <svg viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#7C3AED" fillOpacity=".15"/><path d="M24 14a4 4 0 100 8 4 4 0 000-8zM14 34c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <h3 className="profile-card__title">Cidadão</h3>
              <p className="profile-card__desc">Acompanhe as licitações do seu município e estado com total transparência. Exercite o controle social dos gastos públicos.</p>
              <ul className="profile-card__list">
                <li>Consulta pública gratuita</li>
                <li>Acompanhamento em tempo real</li>
                <li>Denúncias e ouvidoria</li>
                <li>Relatórios de gastos públicos</li>
              </ul>
              <a href="#" className="btn btn--purple btn--sm">Quero Acompanhar</a>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= BUSCA */}
      <section className="search-section section" id="busca">
        <div className="container">
          <div className="section-header section-header--light">
            <h2 className="section-title section-title--white">Encontre licitações em todo o Brasil</h2>
            <p className="section-subtitle section-subtitle--light">Mais de 128 mil processos ativos de todos os estados e municípios brasileiros.</p>
          </div>
          <div className="search-box">
            <div className="search-box__filters">
              <select className="search-box__select">
                <option value="">Todos os estados</option>
                {["São Paulo","Rio de Janeiro","Minas Gerais","Bahia","Paraná","Rio Grande do Sul","Santa Catarina","Goiás","Pernambuco","Ceará"].map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="search-box__select">
                <option value="">Tipo de processo</option>
                {["Pregão Eletrônico","Dispensa Eletrônica","Concorrência","Tomada de Preços","Credenciamento","Cotação Eletrônica"].map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="search-box__select">
                <option value="">Segmento</option>
                {["Tecnologia da Informação","Obras e Serviços de Engenharia","Material de Consumo","Serviços Gerais","Saúde","Educação"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="search-box__input-row">
              <input type="text" className="search-box__input" placeholder="Busque por objeto, número do processo, órgão ou palavra-chave..." />
              <button className="btn btn--primary btn--lg search-box__btn">
                <SearchIcon /> Buscar
              </button>
            </div>
          </div>
          <div className="search-tags">
            {["Material de Escritório","Computadores","Serviços de Limpeza","Veículos","Obras Civis","Medicamentos"].map(t => (
              <span key={t} className="search-tag">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================= COMO FUNCIONA */}
      <section className="how-it-works section" id="como-funciona">
        <div className="container">
          <div className="section-header">
            <span className="badge badge--light">Processo simplificado</span>
            <h2 className="section-title">Como funciona a <strong>Licita Brasil Web</strong></h2>
            <p className="section-subtitle">Em poucos passos, seu processo licitatório está publicado, gerenciado e concluído.</p>
          </div>
          <div className="steps">
            {[
              { n:"01", title:"Cadastro e Habilitação", desc:"Cadastre seu órgão ou empresa em minutos. Validamos seus dados e habilitamos o acesso à plataforma." },
              { n:"02", title:"Publicação do Edital", desc:"Monte e publique seu edital com modelos prontos e em conformidade com a Lei 14.133/2021." },
              { n:"03", title:"Recebimento de Propostas", desc:"Os fornecedores enviam suas propostas digitalmente. O sistema organiza e valida tudo automaticamente." },
              { n:"04", title:"Julgamento e Homologação", desc:"Realize a sessão pública online, julgue as propostas e homologue o resultado — tudo na plataforma." },
              { n:"05", title:"Contrato Digital", desc:"Assine o contrato eletronicamente, gerencie aditivos e acompanhe a execução em tempo real." },
            ].map((s, i) => (
              <>
                <div className="step" key={s.n}>
                  <div className="step__number">{s.n}</div>
                  <div className="step__icon">
                    <svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#EEF2FF"/><path d="M14 20l4 4 8-8" stroke="#1B4FD8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <h3 className="step__title">{s.title}</h3>
                  <p className="step__desc">{s.desc}</p>
                </div>
                {i < 4 && <div className="step__connector" key={`c${i}`} />}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================= DIFERENCIAIS */}
      <section className="features section" id="diferenciais">
        <div className="container">
          <div className="section-header">
            <span className="badge badge--light">Por que escolher a Licita Brasil Web</span>
            <h2 className="section-title">Tecnologia e suporte que fazem a <strong>diferença</strong></h2>
          </div>
          <div className="features__grid">
            {[
              { color:"blue",   icon:<ShieldIcon />, title:"100% Conforme a Lei 14.133", desc:"Plataforma totalmente atualizada com a Nova Lei de Licitações e Contratos Administrativos." },
              { color:"green",  icon:<BoltIcon />, title:"Processos até 5x mais rápidos", desc:"Automações inteligentes reduzem o tempo dos processos licitatórios e eliminam retrabalho." },
              { color:"orange", icon:<TeamIcon />, title:"Suporte Especializado", desc:"Equipe de especialistas em licitações disponível por telefone, WhatsApp, e-mail e chat 24/7." },
              { color:"purple", icon:<ChartIcon />, title:"Relatórios e BI Integrado", desc:"Dashboards gerenciais em tempo real para acompanhar gastos, prazos e desempenho dos processos." },
              { color:"teal",   icon:<BellIcon />, title:"Alertas Inteligentes", desc:"Receba notificações automáticas de novas licitações por segmento, região e valor estimado." },
              { color:"red",    icon:<LockIcon />, title:"Segurança e LGPD", desc:"Infraestrutura com criptografia de ponta a ponta, certificação ICP-Brasil e conformidade total com a LGPD." },
            ].map(f => (
              <div className="feature-card" key={f.title}>
                <div className={`feature-card__icon feature-card__icon--${f.color}`}>{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ======================================================= NOTICIAS */}
      <section className="news section" id="noticias">
        <div className="container">
          <div className="section-header">
            <span className="badge badge--light">Blog &amp; Notícias</span>
            <h2 className="section-title">Fique por dentro das <strong>novidades em licitações</strong></h2>
          </div>
          <div className="news__grid">
            <article className="news-card news-card--featured">
              <div className="news-card__image news-card__image--1"><span className="news-card__category">Lei 14.133</span></div>
              <div className="news-card__body">
                <span className="news-card__date">18 de abril de 2026</span>
                <h3 className="news-card__title">Obrigatoriedade da Nova Lei de Licitações: prazo final e o que muda para os municípios</h3>
                <p className="news-card__excerpt">Com a entrada em vigor definitiva da Lei 14.133/2021, entenda os principais impactos para gestores públicos e como se adequar.</p>
                <a href="#" className="news-card__link">Ler artigo completo →</a>
              </div>
            </article>
            <article className="news-card">
              <div className="news-card__image news-card__image--2"><span className="news-card__category">Tecnologia</span></div>
              <div className="news-card__body">
                <span className="news-card__date">12 de abril de 2026</span>
                <h3 className="news-card__title">IA nas licitações: como a inteligência artificial está revolucionando as compras públicas</h3>
                <a href="#" className="news-card__link">Ler artigo →</a>
              </div>
            </article>
            <article className="news-card">
              <div className="news-card__image news-card__image--3"><span className="news-card__category">PNCP</span></div>
              <div className="news-card__body">
                <span className="news-card__date">05 de abril de 2026</span>
                <h3 className="news-card__title">Integração PNCP: tudo o que você precisa saber sobre o Portal Nacional de Contratações Públicas</h3>
                <a href="#" className="news-card__link">Ler artigo →</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ======================================================= CTA */}
      <section className="cta-section section" id="cta">
        <div className="container cta-section__inner">
          <div className="cta-section__content">
            <h2 className="cta-section__title">Pronto para modernizar suas licitações?</h2>
            <p className="cta-section__subtitle">Junte-se a mais de 3.800 órgãos públicos que já utilizam a plataforma mais completa do Brasil.</p>
            <div className="cta-section__actions">
              <Link to="/cadastro" className="btn btn--white btn--lg">Cadastrar Gratuitamente</Link>
              <Link to="/contato" className="btn btn--outline-white btn--lg">Falar com Especialista</Link>
            </div>
          </div>
          <div className="cta-section__visual">
            <div className="cta-phones">
              <a href="https://wa.me/5531982667628" target="_blank" rel="noopener noreferrer" className="cta-phone cta-phone--whatsapp" style={{ textDecoration: "none", cursor: "pointer" }}>
                <WhatsAppIcon /> (31) 98266-7628
              </a>
              <a href="mailto:suporte@licitabrasilweb.com.br" className="cta-phone cta-phone--mail" style={{ textDecoration: "none", cursor: "pointer" }}>
                <MailIcon /> suporte@licitabrasilweb.com.br
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= FOOTER */}
      <footer className="footer">
        <div className="container footer__top">
          <div className="footer__brand">
            <a href="/" className="logo logo--white">
              <span className="logo__icon">⚖</span>
              <span className="logo__text">Licita<strong>Brasil</strong><span className="logo__tag">Web</span></span>
            </a>
            <p className="footer__tagline">A plataforma de licitações mais completa e transparente do Brasil.</p>
            <div className="footer__social">
              {[
                { label:"Facebook", icon:<FacebookIcon /> },
                { label:"LinkedIn", icon:<LinkedInIcon /> },
                { label:"Instagram", icon:<InstagramIcon /> },
                { label:"YouTube", icon:<YouTubeIcon /> },
              ].map(s => (
                <a key={s.label} href="#" className="social-link" aria-label={s.label}>{s.icon}</a>
              ))}
            </div>
          </div>
          <div className="footer__links">
            <div className="footer__col">
              <h4 className="footer__col-title">Plataforma</h4>
              <ul>{["Para Compradores","Para Fornecedores","Para Cidadãos","Pregão Eletrônico","Dispensa Eletrônica"].map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Recursos</h4>
              <ul>{["Blog e Notícias","Base de Conhecimento","Vídeo Tutoriais","Webinars","Lei 14.133 Comentada"].map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Empresa</h4>
              <ul>{["Sobre Nós","Carreiras","Imprensa","Parceiros","Contato"].map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
            </div>
            <div className="footer__col">
              <h4 className="footer__col-title">Legal</h4>
              <ul>{["Termos de Uso","Política de Privacidade","Política LGPD","Código de Ética","Acessibilidade"].map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <div className="container footer__bottom-inner">
            <p>&copy; 2026 Licita Brasil Web Tecnologia S/A · CNPJ 00.000.000/0001-00</p>
            <p>Av. Paulista, 1000 – Bela Vista, São Paulo – SP · CEP 01310-100</p>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ---- Inline SVG icons ---- */
function ChevronIcon() {
  return <svg className="icon-chevron" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>;
}
function SearchIcon() {
  return <svg viewBox="0 0 20 20" fill="currentColor" className="btn__icon"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>;
}
function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>;
}
function ShieldIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>; }
function BoltIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>; }
function TeamIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>; }
function ChartIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>; }
function BellIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>; }
function LockIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>; }
function WhatsAppIcon() { return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>; }
function MailIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>; }
function FacebookIcon()  { return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>; }
function LinkedInIcon()  { return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>; }
function InstagramIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>; }
function YouTubeIcon()   { return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>; }
