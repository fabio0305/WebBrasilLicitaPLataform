import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import StoreIcon from "@mui/icons-material/Store";
import BarChartIcon from "@mui/icons-material/BarChart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

// ─── Mock price data (in production would come from PNCP/API) ─────────────────

interface PriceRecord {
  id: string;
  description: string;
  unit: string;
  unitPriceCents: number;
  source: string;
  date: string;
  state: string;
  quantity: number;
  supplier: string;
  category: string;
}

function generateMockData(): PriceRecord[] {
  const items = [
    { desc: "Papel A4 75g/m² - Resma c/ 500 folhas", unit: "RESMA", cat: "Material de Escritório", price: 2490 },
    { desc: "Caneta Esferográfica Azul", unit: "CX", cat: "Material de Escritório", price: 890 },
    { desc: "Notebook Intel Core i5 8GB 256GB SSD", unit: "UN", cat: "Equipamentos de TI", price: 289900 },
    { desc: "Mouse USB Óptico", unit: "UN", cat: "Equipamentos de TI", price: 4990 },
    { desc: "Teclado USB ABNT2", unit: "UN", cat: "Equipamentos de TI", price: 9990 },
    { desc: "Monitor LED 24\" Full HD", unit: "UN", cat: "Equipamentos de TI", price: 89900 },
    { desc: "Impressora Laser Monocromática", unit: "UN", cat: "Equipamentos de TI", price: 149900 },
    { desc: "Cadeira Ergonômica com Apoio Lombar", unit: "UN", cat: "Mobiliário", price: 62000 },
    { desc: "Mesa de Escritório 120x60cm", unit: "UN", cat: "Mobiliário", price: 45000 },
    { desc: "Ar Condicionado Split 12000 BTUs", unit: "UN", cat: "Eletrodomésticos", price: 189900 },
    { desc: "Álcool Gel 70% 500ml", unit: "UN", cat: "Higiene e Limpeza", price: 590 },
    { desc: "Detergente Neutro 500ml", unit: "UN", cat: "Higiene e Limpeza", price: 290 },
    { desc: "Pneu 175/70 R13", unit: "UN", cat: "Veículos e Manutenção", price: 34900 },
    { desc: "Filtro de Linha 6 Tomadas", unit: "UN", cat: "Equipamentos de TI", price: 3990 },
    { desc: "HD Externo 1TB USB 3.0", unit: "UN", cat: "Equipamentos de TI", price: 34900 },
  ];
  const states = ["SP", "RJ", "MG", "RS", "PR", "BA", "GO", "PE"];
  const sources = ["PNCP", "BNC", "Comprasnet", "BEC-SP", "LICITANET"];
  const suppliers = ["Tech Solucoes LTDA", "Office Brasil", "Distribuidora Nacional", "GovSupply", "FastTech"];

  return items.flatMap((item, i) =>
    Array.from({ length: 3 }, (_, j) => {
      const variation = 1 + (Math.random() - 0.5) * 0.3;
      return {
        id: `${i}-${j}`,
        description: item.desc,
        unit: item.unit,
        unitPriceCents: Math.round(item.price * variation),
        source: sources[Math.floor(Math.random() * sources.length)],
        date: new Date(Date.now() - Math.random() * 180 * 86400000).toISOString(),
        state: states[Math.floor(Math.random() * states.length)],
        quantity: Math.floor(Math.random() * 100) + 1,
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
        category: item.cat,
      };
    })
  );
}

const ALL_RECORDS = generateMockData();
const CATEGORIES = ["Todos", ...Array.from(new Set(ALL_RECORDS.map((r) => r.category)))].sort();

function centsToReal(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function avgCents(records: PriceRecord[]): number {
  if (!records.length) return 0;
  return Math.round(records.reduce((s, r) => s + r.unitPriceCents, 0) / records.length);
}

function minCents(records: PriceRecord[]): number {
  return Math.min(...records.map((r) => r.unitPriceCents));
}

function maxCents(records: PriceRecord[]): number {
  return Math.max(...records.map((r) => r.unitPriceCents));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BancoDePrecoPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [results, setResults] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = () => {
    setLoading(true);
    setSearched(true);
    setTimeout(() => {
      let filtered = ALL_RECORDS;
      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter((r) => r.description.toLowerCase().includes(q));
      }
      if (category !== "Todos") {
        filtered = filtered.filter((r) => r.category === category);
      }
      setResults(filtered);
      setLoading(false);
    }, 400);
  };

  // Group results by description
  const grouped = results.reduce<Record<string, PriceRecord[]>>((acc, r) => {
    if (!acc[r.description]) acc[r.description] = [];
    acc[r.description].push(r);
    return acc;
  }, {});

  const descriptions = Object.keys(grouped);

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <BarChartIcon sx={{ color: "#2c3f31", fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700}>Banco de Preços</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Consulte preços de referência de compras públicas anteriores para embasar suas propostas.
        </Typography>
      </Box>

      {/* Search */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={7}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por descrição do item..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") search(); }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select fullWidth size="small" label="Categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                SelectProps={{ native: true }}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={search}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                disabled={loading}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!searched && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <BarChartIcon sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Busque por um item para ver os preços praticados em compras públicas.
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Dados de PNCP, BNC, Comprasnet e demais portais.
          </Typography>
        </Box>
      )}

      {searched && loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>
      )}

      {searched && !loading && descriptions.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <SearchIcon sx={{ fontSize: 48, color: "text.disabled" }} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>Nenhum resultado encontrado.</Typography>
        </Box>
      )}

      {!loading && descriptions.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {descriptions.length} item(s) · {results.length} ocorrência(s) encontrada(s)
          </Typography>

          {descriptions.map((desc) => {
            const recs = grouped[desc];
            const avg = avgCents(recs);
            const min = minCents(recs);
            const max = maxCents(recs);
            const unit = recs[0].unit;
            const cat = recs[0].category;

            return (
              <Card key={desc} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>{desc}</Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Chip label={unit} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                        <Chip label={cat} size="small" color="primary" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                        <Chip label={`${recs.length} ocorrências`} size="small" sx={{ fontSize: 10, height: 18 }} />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                      <Box sx={{ textAlign: "center", minWidth: 80 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Mínimo</Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">{centsToReal(min)}</Typography>
                      </Box>
                      <Box sx={{ textAlign: "center", minWidth: 80 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Médio</Typography>
                        <Typography variant="body2" fontWeight={800} color="primary.main">{centsToReal(avg)}</Typography>
                      </Box>
                      <Box sx={{ textAlign: "center", minWidth: 80 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Máximo</Typography>
                        <Typography variant="body2" fontWeight={700} color="error.main">{centsToReal(max)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Divider />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "text.secondary" }}>Fonte</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "text.secondary" }}>Fornecedor</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "text.secondary" }} align="center">UF</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "text.secondary" }} align="right">Qtd</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "text.secondary" }} align="right">
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                            <AttachMoneyIcon sx={{ fontSize: 12 }} />Preço Unit.
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "text.secondary" }} align="center">Data</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "text.secondary" }} align="center">vs. Médio</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recs.slice(0, 5).map((r) => {
                        const diff = ((r.unitPriceCents - avg) / avg) * 100;
                        const isBelow = diff < -5;
                        const isAbove = diff > 5;
                        return (
                          <TableRow key={r.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                            <TableCell>
                              <Chip label={r.source} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" noWrap>{r.supplier}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption" fontWeight={600}>{r.state}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption">{r.quantity}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700} color={isBelow ? "success.main" : isAbove ? "error.main" : "text.primary"}>
                                {centsToReal(r.unitPriceCents)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="caption" color="text.secondary">
                                {new Date(r.date).toLocaleDateString("pt-BR")}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                {isBelow ? <TrendingDownIcon fontSize="small" sx={{ color: "success.main" }} /> : isAbove ? <StoreIcon fontSize="small" sx={{ color: "error.main" }} /> : null}
                                <Typography variant="caption" fontWeight={600} color={isBelow ? "success.main" : isAbove ? "error.main" : "text.secondary"}>
                                  {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
