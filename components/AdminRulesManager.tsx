"use client";

import { FormEvent, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  LinearProgress,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

type Props = {
  formId: string;
  initialLabCapacity: number;
  confirmedLabChildren: number;
};

export function AdminRulesManager({
  formId,
  initialLabCapacity,
  confirmedLabChildren,
}: Props) {
  const [labCapacity, setLabCapacity] = useState(initialLabCapacity);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_id: formId,
          lab_capacity: Number(labCapacity),
        }),
      });

      const data = (await response.json()) as { message: string };
      setStatus(data.message);
    } catch {
      setStatus("Errore durante il salvataggio delle regole");
    } finally {
      setLoading(false);
    }
  }

  const reachedLimit = confirmedLabChildren >= labCapacity;
  const usagePercent =
    labCapacity > 0
      ? Math.min((confirmedLabChildren / labCapacity) * 100, 100)
      : 0;

  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{ border: "1px solid #d9dfe7", bgcolor: "#f8fafc" }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={1}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#0f8a84",
              }}
            >
              Rules Engine
            </Typography>
            <Typography variant="h5" sx={{ color: "#2d3943", fontWeight: 700 }}>
              Regole
            </Typography>
            <Typography sx={{ fontSize: 15, color: "#62707c", mt: 1 }}>
              Gestisci la soglia dei bambini nei laboratori per controllare
              automaticamente la lista d&apos;attesa.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" },
          gap: 2,
        }}
      >
        <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
          <CardContent sx={{ p: 2.5 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  type="number"
                  label="Limite massimo bambini nei laboratori"
                  size="small"
                  fullWidth
                  value={labCapacity}
                  onChange={(e) => setLabCapacity(Number(e.target.value))}
                  required
                  slotProps={{
                    htmlInput: { min: 1 },
                  }}
                />

                <Card
                  elevation={0}
                  sx={{ border: "1px solid #d9dfe7", bgcolor: "#f8fafc" }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#485560",
                        mb: 1,
                      }}
                    >
                      Occupazione attuale
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#2d3943",
                        mb: 1.5,
                      }}
                    >
                      {confirmedLabChildren} / {labCapacity}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={usagePercent}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#dde3ea",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#0f8a84",
                        },
                      }}
                    />
                  </CardContent>
                </Card>

                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={<SaveIcon />}
                    sx={{
                      backgroundColor: "#0f8a84",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {loading ? "Salvataggio..." : "Salva regole"}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: reachedLimit ? "#f44336" : "#4caf50",
            bgcolor: reachedLimit
              ? "rgba(244, 67, 54, 0.05)"
              : "rgba(76, 175, 80, 0.05)",
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#485560",
                }}
              >
                Stato automatico iscrizioni
              </Typography>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: reachedLimit ? "#f44336" : "#4caf50",
                }}
              >
                {reachedLimit
                  ? "Limite raggiunto: nuove iscrizioni in lista d'attesa"
                  : "Limite disponibile: nuove iscrizioni confermate"}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#62707c" }}>
                Modificando il limite qui, il comportamento del modulo pubblico
                si aggiorna in tempo reale.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {status && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {status}
        </Alert>
      )}
    </Stack>
  );
}
