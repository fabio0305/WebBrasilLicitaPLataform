import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GavelIcon from "@mui/icons-material/Gavel";
import { dashboardApi } from "../api/client";
import type { SupplierDashboard, BidSummary } from "../data/types";

function currency(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatMini({ label, value, color = "text.primary" }: { label: string; value: string | number; color?: string }) {
  return (
    <Box sx={{ textAlign: "center", p: 2 }}>
      <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}

export default function SupplierProposalsPage() {
  const [data, setData] = useState<SupplierDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .supplier()
      .then(setData)
      .catch(() => setError("Não foi possível carregar suas propostas."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const bids: BidSummary[] = data?.recentBids ?? [];

  const groupByAuction = bids.reduce<Record<string, { title: string; bids: BidSummary[] }>>((acc, bid) => {
    const key = bid.auction?.id ?? "unknown";
    if (!acc[key]) acc[key] = { title: bid.auction?.title ?? "Pregão sem título", bids: [] };
    acc[key].bids.push(bid);
    return acc;
  }, {});

  return (
    <Box>
      {/* Summary */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: "0!important" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap" }}>
            {[
              { label: "Propostas Enviadas", value: data?.totalBids ?? 0, color: "primary.main" },
              { label: "Lotes Participados", value: data?.lotsParticipated ?? 0, color: undefined },
              { label: "Pregões", value: data?.auctionsJoined ?? 0, color: undefined },
              { label: "Maior Lance", value: currency(data?.highestBidAmount), color: "success.main" },
            ].map((item, i) => (
              <Box
                key={i}
                sx={{
                  flex: "1 1 25%",
                  minWidth: 120,
                  borderRight: i < 3 ? "1px solid" : "none",
                  borderColor: "divider",
                }}
              >
                <StatMini label={item.label} value={item.value} color={item.color} />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {bids.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <HowToVoteIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Nenhuma proposta enviada</Typography>
          <Typography variant="body2" color="text.secondary">
            Suas propostas enviadas em licitações aparecerão aqui.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {Object.entries(groupByAuction).map(([auctionId, group]) => (
            <Card key={auctionId} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <CardContent sx={{ p: "0!important" }}>
                <Box sx={{ px: 2.5, py: 1.75, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
                  <GavelIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1 }}>{group.title}</Typography>
                  <Chip label={`${group.bids.length} lance(s)`} size="small" color="primary" />
                </Box>
                <List disablePadding>
                  {group.bids.map((bid, i) => (
                    <React.Fragment key={bid.id}>
                      {i > 0 && <Divider />}
                      <ListItem disablePadding sx={{ px: 2.5, py: 1.25 }}>
                        <ListItemText
                          primary={bid.lot?.title ?? `Lote ${bid.lot?.number ?? i + 1}`}
                          secondary={bid.createdAt ? new Date(bid.createdAt).toLocaleString("pt-BR") : undefined}
                          primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="body1" fontWeight={700} color="primary.main">
                            {currency(bid.amount)}
                          </Typography>
                          {bid.status && (
                            <Chip
                              label={bid.status}
                              size="small"
                              color={bid.status === "WINNER" ? "success" : bid.status === "REJECTED" ? "error" : "default"}
                              sx={{ mt: 0.25, fontSize: 10 }}
                            />
                          )}
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
                {/* Lot totals */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end", gap: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <TrendingUpIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">Maior:</Typography>
                    <Typography variant="caption" fontWeight={700} color="success.main">
                      {currency(Math.max(...group.bids.map((b) => b.amount)))}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">Menor:</Typography>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      {currency(Math.min(...group.bids.map((b) => b.amount)))}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
