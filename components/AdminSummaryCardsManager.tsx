"use client";

import { useState } from "react";
import type { RegistrationField, SummaryCardConfig } from "@/lib/types";
import { getAvailableSummaryMetricOptions } from "@/lib/summary-cards";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

type Props = {
  formId: string;
  fields: RegistrationField[];
  initialCards: SummaryCardConfig[] | null;
  supportsLabCapacity: boolean;
  onSaved: (cards: SummaryCardConfig[]) => void;
};

const TOTAL_OPTION_VALUE = "total::";

function optionValue(source: string, key: string | null) {
  return `${source}::${key ?? ""}`;
}

export function AdminSummaryCardsManager({
  formId,
  fields,
  initialCards,
  supportsLabCapacity,
  onSaved,
}: Props) {
  const [cards, setCards] = useState<SummaryCardConfig[]>(initialCards ?? []);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const metricOptions = getAvailableSummaryMetricOptions(fields, {
    includeLabColumns: supportsLabCapacity,
  });

  function updateCard(index: number, patch: Partial<SummaryCardConfig>) {
    setCards((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function addCard() {
    setCards((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: "Nuovo indicatore",
        metric: "count",
        source: "total",
        key: null,
      },
    ]);
  }

  function removeCard(id: string) {
    setCards((current) => current.filter((card) => card.id !== id));
  }

  function moveCard(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    setCards((current) => {
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/forms/summary-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, cards }),
      });

      const data = (await response.json()) as { message: string };
      setStatus(data.message);

      if (response.ok) {
        onSaved(cards);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ color: "#2d3943", fontWeight: 700 }}>
          Indicatori di riepilogo
        </Typography>
        <Typography sx={{ color: "#62707c", fontSize: 14, mt: 0.5 }}>
          Personalizza le card mostrate in cima alla tab Partecipanti: scegli
          titolo, campo e operazione (somma o conteggio). Senza indicatori
          configurati vengono mostrate le card predefinite.
        </Typography>
      </Box>

      <Stack spacing={2}>
        {cards.map((card, index) => (
          <Card
            key={card.id}
            elevation={0}
            sx={{ border: "1px solid #d9dfe7" }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr auto" },
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <TextField
                  label="Titolo card"
                  size="small"
                  fullWidth
                  value={card.title}
                  onChange={(e) =>
                    updateCard(index, { title: e.target.value })
                  }
                />

                <TextField
                  select
                  label="Campo"
                  size="small"
                  fullWidth
                  value={optionValue(card.source, card.key)}
                  onChange={(e) => {
                    const [source, key] = e.target.value.split("::");
                    updateCard(index, {
                      source: source as SummaryCardConfig["source"],
                      key: source === "total" ? null : key,
                      metric: source === "total" ? "count" : card.metric,
                    });
                  }}
                  slotProps={{ select: { native: true } }}
                >
                  <option value={TOTAL_OPTION_VALUE}>Iscrizioni totali</option>
                  {metricOptions.map((option) => (
                    <option
                      key={optionValue(option.source, option.key)}
                      value={optionValue(option.source, option.key)}
                    >
                      {option.label}
                    </option>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Operazione"
                  size="small"
                  fullWidth
                  value={card.metric}
                  disabled={card.source === "total"}
                  onChange={(e) =>
                    updateCard(index, {
                      metric: e.target.value as SummaryCardConfig["metric"],
                    })
                  }
                  slotProps={{ select: { native: true } }}
                >
                  <option value="sum">Somma</option>
                  <option value="count">Conteggio</option>
                </TextField>

                <IconButton
                  color="error"
                  aria-label={`Elimina ${card.title}`}
                  onClick={() => removeCard(card.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                <IconButton
                  size="small"
                  disabled={index === 0}
                  onClick={() => moveCard(index, -1)}
                  aria-label={`Sposta su ${card.title}`}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={index === cards.length - 1}
                  onClick={() => moveCard(index, 1)}
                  aria-label={`Sposta giù ${card.title}`}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addCard}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Aggiungi indicatore
        </Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={save}
          sx={{
            backgroundColor: "#0f8a84",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {saving ? "Salvataggio..." : "Salva indicatori"}
        </Button>
      </Box>

      {status && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {status}
        </Alert>
      )}
    </Stack>
  );
}
