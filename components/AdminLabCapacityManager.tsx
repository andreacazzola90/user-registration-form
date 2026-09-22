"use client";

import { FormEvent, useState } from "react";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type Props = {
  formId: string;
  initialCapacity: number;
  initialEnabled: boolean;
  confirmedLabChildren: number;
  onEnabledChange: (enabled: boolean) => void;
};

export function AdminLabCapacityManager({
  formId,
  initialCapacity,
  initialEnabled,
  confirmedLabChildren,
  onEnabledChange,
}: Props) {
  const [capacity, setCapacity] = useState(initialCapacity);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const usagePercent =
    capacity > 0
      ? Math.min((confirmedLabChildren / capacity) * 100, 100)
      : 0;

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
          lab_capacity: Number(capacity),
          lab_capacity_enabled: enabled,
        }),
      });
      const data = (await response.json()) as { message: string };
      setStatus(data.message);
      if (response.ok) {
        onEnabledChange(enabled);
      }
    } catch {
      setStatus("Errore durante il salvataggio della capienza");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h5" sx={{ color: "#2d3943", fontWeight: 700 }}>
            Laboratori bambini
          </Typography>
          <Typography sx={{ color: "#62707c", mt: 1 }}>
            Imposta il numero massimo di bambini ammessi ai laboratori. Oltre
            questa soglia le nuove iscrizioni entrano in lista d&apos;attesa.
          </Typography>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                  />
                }
                label={
                  enabled
                    ? "Controllo capienza attivo"
                    : "Controllo capienza disattivato"
                }
              />
              <TextField
                type="number"
                label="Limite massimo bambini nei laboratori"
                size="small"
                value={capacity}
                onChange={(event) => setCapacity(Number(event.target.value))}
                disabled={!enabled}
                required
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <Box>
                <Typography sx={{ fontWeight: 700, color: "#2d3943", mb: 1 }}>
                  Occupazione: {confirmedLabChildren} / {capacity}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={usagePercent}
                  sx={{ height: 7, borderRadius: 1, mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={<SaveIcon />}
                >
                  {loading ? "Salvataggio..." : "Salva impostazioni"}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {status && <Alert severity="info">{status}</Alert>}
    </Stack>
  );
}