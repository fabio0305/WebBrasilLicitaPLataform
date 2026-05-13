# Licita Brasil Web

Plataforma completa de licitações públicas eletrônicas para o Brasil, conectando órgãos públicos a fornecedores com tecnologia, transparência e conformidade legal (Lei 14.133/2021).

---

## Visão Geral

O **Licita Brasil Web** é um sistema full-stack de gestão de compras públicas que cobre todo o ciclo de vida de uma licitação: desde a criação do edital, publicação no PNCP, sala de disputas em tempo real, julgamento de propostas, habilitação de fornecedores até a geração de contratos e atas de registro de preço.

---

## Funcionalidades

### Módulo de Licitações
- Criação e gestão de processos licitatórios: **Pregão Eletrônico**, Dispensa, Credenciamento, Concorrência, Inexigibilidade, Leilão e Pré-Qualificação
- Fases do processo: Interna → Publicada → Propostas → Classificação → Sessão → Habilitação → Decisão → Contrato
- Critérios de julgamento: Menor Preço, Maior Desconto, Técnica e Preço, Melhor Técnica
- Lotes múltiplos por processo

### Sala de Disputa em Tempo Real
- Lances em tempo real via **Socket.IO** e Redis Adapter
- Modos de disputa: Aberto e Aberto/Fechado
- Dashboard ao vivo para pregoeiros e fornecedores

### Painel por Perfil de Usuário
| Perfil | Painel |
|--------|--------|
| Administrador | Gestão de usuários, órgãos, aprovações, papéis e permissões |
| Órgão Público (Pregoeiro, Assessor Jurídico, Ordenador, Gestor) | Pregões, contratos, equipe, documentos, declarações |
| Fornecedor | Propostas, contratos, documentos, usuários da empresa |
| Cidadão | Acompanhamento de licitações e transparência |

### Gestão de Fornecedores
- Cadastro com validação de CNPJ e CPF
- Upload de documentos de habilitação
- Histórico de propostas e contratos
- Multi-usuários por empresa

### Integrações e Conformidade
- **PNCP** (Portal Nacional de Contratações Públicas): publicação automática via fila de jobs
- Suporte planejado ao **Gov.br** (Bronze, Prata, Ouro)
- Auditoria completa de todas as operações (AuditLog)
- Política de senha segura

### Segurança
- RBAC (Role-Based Access Control) granular com seeds de permissões
- Proteção CSRF em todas as rotas de escrita
- Rate limiting por endpoint (geral, escrita e sensível)
- Sessões server-side armazenadas no Redis
- Hash SHA-256 de CPF para armazenamento seguro
- Helmet + CORS configurado por domínio
- TLS 1.2/1.3 via Let's Encrypt + Certbot com renovação automática

### Comunicação
- Notificações internas com sistema de respostas
- Chat por processo licitatório
- Solicitações de esclarecimento
- E-mail transacional via Nodemailer (Mailpit em dev)
- Notificação de aprovação de cadastro por e-mail

---

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Nginx      │────▶│  Frontend    │     │  Mailpit     │
│  (Reverse   │     │  React SPA   │     │  (Dev Email) │
│  Proxy +    │     │  Port 80     │     │  Port 8025   │
│  TLS)       │     └──────────────┘     └──────────────┘
│  Port 80/443│     ┌──────────────┐     ┌──────────────┐
│             │────▶│  Backend     │────▶│  PostgreSQL  │
│             │     │  Express API │     │  Port 5432   │
│  Static     │     │  + Socket.IO │     └──────────────┘
│  Landing    │     │  Port 3000   │────▶┌──────────────┐
│  Pages      │     └──────────────┘     │  Redis       │
└─────────────┘                          │  Sessions +  │
                                         │  Realtime    │
                                         └──────────────┘
```

### Camadas da Aplicação

- **Landing Page** — HTML/CSS/JS estático servido pelo Nginx (index, login, cadastro, recuperar senha, contato)
- **Frontend SPA** — React 18 com TypeScript e Vite, servido pelo Nginx como proxy reverso
- **Backend API** — Node.js com Express, rotas REST em `/api/*`
- **Realtime** — Socket.IO com Redis Adapter para salas de disputa e dashboard de órgãos
- **Banco de Dados** — PostgreSQL com TypeORM e migrations versionadas
- **Cache / Sessões** — Redis para sessões server-side e pub/sub do Socket.IO
- **E-mail** — Nodemailer (SMTP configurável); Mailpit para ambiente de desenvolvimento

---

## Stack Tecnológica

### Backend
| Tecnologia | Uso |
|------------|-----|
| Node.js + TypeScript | Runtime e tipagem |
| Express.js | Framework HTTP + middlewares |
| TypeORM | ORM com migrations |
| PostgreSQL 14 | Banco de dados relacional |
| Redis 7 | Sessões, cache e pub/sub |
| Socket.IO 4 | Comunicação em tempo real |
| Nodemailer | Envio de e-mails transacionais |
| Helmet | Headers de segurança HTTP |
| express-rate-limit | Rate limiting por rota |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| React 18 + TypeScript | UI e lógica de componentes |
| Vite | Build tool e dev server |
| Material-UI (MUI) v5 | Design system e componentes |
| React Router v6 | Roteamento client-side |
| Socket.IO Client | Lances e notificações em tempo real |
| Axios | Requisições HTTP à API |

### Infraestrutura
| Tecnologia | Uso |
|------------|-----|
| Docker + Docker Compose | Containerização e orquestração |
| Nginx | Reverse proxy, TLS termination, arquivos estáticos |
| Let's Encrypt + Certbot | Certificados SSL com renovação automática |
| Mailpit | Servidor SMTP local para testes |

---

## Estrutura do Projeto

```
WebBrasilLicitaPLataform/
├── backend/                  # API Node.js + TypeScript
│   └── src/
│       ├── entities/         # Entidades TypeORM (User, Auction, Lot, Bid…)
│       ├── routes/           # Rotas REST da API
│       ├── middlewares/      # Auth, RBAC, CSRF, AuditLog
│       ├── migrations/       # Migrations de banco de dados
│       ├── rbac/             # Seed de permissões e papéis
│       ├── realtime/         # Socket.IO rooms e handlers
│       ├── services/         # PNCP, procurement
│       ├── auth/             # Sessões, cookies, onboarding
│       ├── notifications/    # Mailer
│       └── utils/            # CPF, CNPJ, dinheiro, senhas
├── frontend/                 # SPA React + TypeScript
│   └── src/
│       ├── pages/            # Páginas por perfil de usuário
│       ├── components/       # Layout e componentes reutilizáveis
│       ├── auth/             # AuthContext, ProfileContext
│       ├── api/              # Cliente HTTP (Axios)
│       └── data/             # Tipos TypeScript compartilhados
├── nginx/
│   ├── html/                 # Landing pages estáticas
│   └── conf.d/               # Configuração do Nginx
├── docker-compose.yml        # Orquestração de todos os serviços
└── .env                      # Variáveis de ambiente (não versionado)
```

---

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `*` | `/api/health` | Health check |
| `*` | `/api/auth/*` | Autenticação, cadastro, recuperação de senha |
| `*` | `/api/admin/*` | Gestão de usuários, órgãos e aprovações |
| `*` | `/api/agencies/*` | Órgãos públicos |
| `*` | `/api/auctions/*` | Processos licitatórios |
| `*` | `/api/lots/*` | Lotes de licitação e lances |
| `*` | `/api/proposals/*` | Propostas de fornecedores |
| `*` | `/api/solicitations/*` | Solicitações de esclarecimento |
| `*` | `/api/chat/*` | Mensagens por processo |
| `*` | `/api/notifications/*` | Notificações e respostas |
| `*` | `/api/dashboards/*` | Dados dos painéis por perfil |
| `*` | `/api/contact` | Formulário de contato |
| `GET` | `/api/public/*` | Estatísticas públicas (sem autenticação) |

---

## Papéis de Usuário

| Papel | Descrição |
|-------|-----------|
| `ADMIN` | Administrador geral da plataforma |
| `AGENCY_ADMIN` | Administrador do órgão público |
| `AUCTIONEER` | Pregoeiro — conduz as sessões de disputa |
| `AUTHORITY` | Autoridade competente / Ordenador de despesas |
| `PUBLIC_AGENCY` | Usuário genérico de órgão público |
| `SUPPORT` | Suporte técnico da plataforma |
| `SUPPLIER` | Fornecedor / empresa licitante |
| `CITIZEN` | Cidadão — acesso de transparência |

---

## Como Executar

### Pré-requisitos
- Docker e Docker Compose
- Git

### Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/fabio0305/WebBrasilLicitaPLataform.git
cd WebBrasilLicitaPLataform

# Copie e configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Suba todos os serviços
docker compose up -d

# Acompanhe os logs
docker compose logs -f backend
```

O Mailpit (interface de e-mail de desenvolvimento) estará disponível em `http://localhost:8025`.

### Produção

Configure o `.env` com o domínio real e execute:

```bash
docker compose up -d
```

O Certbot renova os certificados SSL automaticamente a cada 12 horas.

---

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `POSTGRES_USER` | Usuário do PostgreSQL |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL |
| `POSTGRES_DB` | Nome do banco de dados |
| `SESSION_SECRET` | Segredo para assinatura das sessões |
| `PUBLIC_URL` | URL pública da aplicação |
| `CORS_ORIGIN` | Origem permitida para CORS |
| `SMTP_*` | Configurações de e-mail |
| `PNCP_ENABLED` | Habilita integração com o PNCP |
| `PNCP_BASE_URL` | URL base da API do PNCP |

---

## Domínio

A plataforma está publicada em **[licitabrasilweb.com.br](https://licitabrasilweb.com.br)**.

---

## Licença

Projeto privado — todos os direitos reservados.
