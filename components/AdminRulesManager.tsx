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
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

type Props = {
  formId: string;
  initialMaxParticipants: number;
  initialRegistrationsCloseAt: string | null;
  totalRegistrations: number;
};

export function AdminRulesManager({
  formId,
  initialMaxParticipants,
  initialRegistrationsCloseAt,
  totalRegistrations,
}: Props) {
  const [maxParticipants, setMaxParticipants] = useState(initialMaxParticipants);
  const [registrationsCloseAt, setRegistrationsCloseAt] = useState(
    toDateTimeLocalValue(initialRegistrationsCloseAt),
  );
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
          max_participants: Number(maxParticipants),
          registrations_close_at: toIsoOrNull(registrationsCloseAt),
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

  const maxParticipantsReached = totalRegistrations >= maxParticipants;
  const closeDateReached = isCloseDateReached(registrationsCloseAt);
  const registrationsClosed = maxParticipantsReached || closeDateReached;

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
              Definisci il limite massimo di iscrizioni e la data di chiusura
              per bloccare automaticamente il form pubblico.
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
                  label="Numero massimo iscrizioni"
                  size="small"
                  fullWidth
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  required
                  slotProps={{
                    htmlInput: { min: 1 },
                  }}
                  helperText="Raggiunta questa soglia, il form viene nascosto e compare il messaggio di iscrizioni concluse."
                />

                <TextField
                  type="datetime-local"
                  label="Data e ora chiusura iscrizioni"
                  size="small"
                  fullWidth
                  value={registrationsCloseAt}
                  onChange={(e) => setRegistrationsCloseAt(e.target.value)}
                  helperText="Campo opzionale: da questa data/ora il form viene bloccato automaticamente."
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />

                <Typography sx={{ fontSize: 14, color: "#62707c" }}>
                  Iscrizioni totali: {totalRegistrations} / {maxParticipants}
                </Typography>

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
            borderColor: registrationsClosed ? "#f44336" : "#4caf50",
            bgcolor: registrationsClosed
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
                  color: registrationsClosed ? "#f44336" : "#4caf50",
                }}
              >
                {registrationsClosed
                  ? "Iscrizioni concluse: il form pubblico e bloccato"
                  : "Iscrizioni aperte"}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#62707c" }}>
                {closeDateReached
                  ? "Motivo: data di chiusura raggiunta."
                  : maxParticipantsReached
                    ? "Motivo: raggiunto il numero massimo di iscrizioni."
                    : "Le modifiche vengono applicate in tempo reale al modulo pubblico."}
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

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offsetMs = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function isCloseDateReached(value: string) {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && Date.now() >= parsed.getTime();
}
