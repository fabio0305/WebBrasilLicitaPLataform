import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CategoryIcon from "@mui/icons-material/Category";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../auth/AuthContext";

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <CardContent sx={{ p: "0!important" }}>
        <Box
          sx={{
            px: 2.5, py: 1.75,
            display: "flex", alignItems: "center", gap: 1.5,
            bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider",
          }}
        >
          <Box sx={{ color: "primary.main" }}>{icon}</Box>
          <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: 10, letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {value || <span style={{ color: "#bbb" }}>Não informado</span>}
      </Typography>
    </Box>
  );
}

// ─── Segments list ────────────────────────────────────────────────────────────

const SEGMENTS_DATA: Record<number, string> = {
  1: "Tecnologia da Informação e Software",
  2: "Consultoria e Serviços Profissionais",
  3: "Obras e Construção Civil",
  4: "Material de Escritório e Papelaria",
  5: "Equipamentos de Informática",
  6: "Saúde e Produtos Médicos",
  7: "Alimentação e Refeições Coletivas",
  8: "Limpeza, Higiene e Conservação",
  9: "Segurança Patrimonial e Eletrônica",
  10: "Transporte e Logística",
  11: "Comunicação, Marketing e Publicidade",
  12: "Engenharia e Projetos Técnicos",
  13: "Meio Ambiente e Sustentabilidade",
  14: "Energia, Elétrica e Utilidades",
  15: "Educação e Treinamento",
  16: "Financeiro, Contábil e Jurídico",
  17: "Vestuário, EPIs e Uniformes",
  18: "Móveis, Equipamentos e Decoração",
  19: "Veículos, Locação e Manutenção",
  20: "Telecomunicações e Internet",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupplierCompanyPage() {
  const { user } = useAuth();
  const sp = user?.supplierProfile;
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasProfile = Boolean(sp?.cnpj || sp?.companyName);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {sp?.companyName || sp?.tradeName || "Minha Empresa"}
          </Typography>
          {sp?.cnpj && (
            <Typography variant="body2" color="text.secondary">CNPJ: {sp.cnpj}</Typography>
          )}
        </Box>
        {hasProfile && (
          <Button
            variant={editMode ? "contained" : "outlined"}
            size="small"
            startIcon={editMode ? <CheckCircleIcon /> : <EditIcon />}
            onClick={() => {
              if (editMode) setSaved(true);
              setEditMode((v) => !v);
            }}
          >
            {editMode ? "Salvar" : "Editar"}
          </Button>
        )}
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>
          Dados da empresa atualizados com sucesso.
        </Alert>
      )}

      {!hasProfile ? (
        <Alert severity="warning">
          Seu perfil de fornecedor ainda não foi configurado. Complete o cadastro para começar a participar de licitações.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {/* Identification */}
          <Grid item xs={12} md={6}>
            <SectionCard title="Identificação" icon={<BusinessIcon fontSize="small" />}>
              {editMode ? (
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <TextField label="Razão Social" fullWidth size="small" defaultValue={sp?.companyName} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Nome Fantasia" fullWidth size="small" defaultValue={sp?.tradeName} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="CNPJ" fullWidth size="small" defaultValue={sp?.cnpj} disabled />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Regime Tributário" fullWidth size="small" defaultValue={sp?.taxRegime} />
                  </Grid>
                </Grid>
              ) : (
                <>
                  <InfoRow label="Razão Social" value={sp?.companyName} />
                  <InfoRow label="Nome Fantasia" value={sp?.tradeName} />
                  <InfoRow label="CNPJ" value={sp?.cnpj} />
                  <InfoRow label="Regime Tributário" value={sp?.taxRegime} />
                  <InfoRow label="Tipo de Pessoa" value={sp?.entityType} />
                </>
              )}
            </SectionCard>
          </Grid>

          {/* Address */}
          <Grid item xs={12} md={6}>
            <SectionCard title="Endereço" icon={<LocationOnIcon fontSize="small" />}>
              {editMode ? (
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={4}>
                    <TextField label="CEP" fullWidth size="small" defaultValue={sp?.postalCode} />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField label="Logradouro" fullWidth size="small" defaultValue={sp?.street} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Número" fullWidth size="small" defaultValue={sp?.number} />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField label="Bairro" fullWidth size="small" defaultValue={sp?.district} />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField label="Município" fullWidth size="small" defaultValue={sp?.city} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="UF" fullWidth size="small" defaultValue={sp?.state} />
                  </Grid>
                </Grid>
              ) : (
                <>
                  <InfoRow
                    label="Endereço"
                    value={
                      sp?.street
                        ? `${sp.street}${sp.number ? `, ${sp.number}` : ""}${sp.district ? ` – ${sp.district}` : ""}`
                        : undefined
                    }
                  />
                  <InfoRow label="Município / UF" value={sp?.city && sp?.state ? `${sp.city} / ${sp.state}` : sp?.city || sp?.state} />
                  <InfoRow label="CEP" value={sp?.postalCode} />
                  <InfoRow label="País" value={sp?.country || "Brasil"} />
                </>
              )}
            </SectionCard>
          </Grid>

          {/* Bank data */}
          <Grid item xs={12} md={6}>
            <SectionCard title="Dados Bancários" icon={<AccountBalanceIcon fontSize="small" />}>
              {editMode ? (
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={8}>
                    <TextField label="Banco" fullWidth size="small" defaultValue={sp?.bankName} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField label="Agência" fullWidth size="small" defaultValue={sp?.bankBranch} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Tipo de Conta" fullWidth size="small" defaultValue={sp?.bankAccountType} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Chave PIX" fullWidth size="small" defaultValue={sp?.pixKey} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="E-mail Financeiro" fullWidth size="small" defaultValue={sp?.financeEmail} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Telefone Financeiro" fullWidth size="small" defaultValue={sp?.financePhone} />
                  </Grid>
                </Grid>
              ) : (
                <>
                  <InfoRow label="Banco" value={sp?.bankName} />
                  <InfoRow label="Agência" value={sp?.bankBranch} />
                  <InfoRow label="Tipo de Conta" value={sp?.bankAccountType} />
                  <InfoRow label="Chave PIX" value={sp?.pixKey} />
                  <Divider sx={{ my: 1.5 }} />
                  <InfoRow label="E-mail Financeiro" value={sp?.financeEmail} />
                  <InfoRow label="Telefone Financeiro" value={sp?.financePhone} />
                </>
              )}
            </SectionCard>
          </Grid>

          {/* Segments */}
          <Grid item xs={12} md={6}>
            <SectionCard title="Segmentos de Atuação" icon={<CategoryIcon fontSize="small" />}>
              {!sp?.segments || sp.segments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhum segmento cadastrado. Adicione segmentos para aparecer em licitações relevantes.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {sp.segments.map((s) => {
                    const name = SEGMENTS_DATA[Number(s)] ?? s;
                    return (
                      <Chip
                        key={s}
                        label={name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
