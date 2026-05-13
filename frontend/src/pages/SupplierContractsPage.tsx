import React from "react";
import { Box, Button, Typography } from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { useNavigate } from "react-router-dom";

export default function SupplierContractsPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <AssignmentTurnedInIcon sx={{ fontSize: 72, color: "text.disabled", mb: 2 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        Meus Contratos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: "auto" }}>
        Os contratos firmados com órgãos públicos após vencer licitações aparecerão aqui. Acompanhe prazos, valores e documentações necessárias.
      </Typography>
      <Button variant="contained" onClick={() => navigate("/pregoes")}>
        Buscar Licitações
      </Button>
    </Box>
  );
}
