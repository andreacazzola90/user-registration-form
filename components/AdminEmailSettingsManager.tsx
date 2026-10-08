"use client";

import { useEffect, useState, type FormEvent } from "react";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type EmailSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  passwordConfigured: boolean;
};

const EMPTY_SETTINGS: EmailSettings = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  password: "",
  fromEmail: "",
  fromName: "",
  passwordConfigured: false,
};

export function AdminEmailSettingsManager({ formId }: { formId: string }) {
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch(
          `/api/admin/email-settings?form_id=${encodeURIComponent(formId)}`,
        );
        const data = (await response.json()) as Partial<EmailSettings> & {
          message?: string;
        };
        if (!response.ok) throw new Error(data.message ?? "Caricamento fallito");
        if (active) setSettings({ ...EMPTY_SETTINGS, ...data, password: "" });
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossibile caricare le impostazioni email",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, [formId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, form_id: formId }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Salvataggio fallito");
      setSettings((current) => ({
        ...current,
        password: "",
        passwordConfigured: true,
      }));
      setSuccess(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile salvare le impostazioni email",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack
      component="form"
      spacing={2.5}
      onSubmit={handleSubmit}
      sx={{ maxWidth: 760 }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <AlternateEmailIcon sx={{ color: "#0f8a84" }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Configurazione invio email
        </Typography>
      </Stack>
      <Typography sx={{ color: "#62707c" }}>
        Questa configurazione viene usata per le email inviate da questo form.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Impostazioni email salvate</Alert>}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        <TextField
          label="SMTP host"
          value={settings.host}
          onChange={(event) =>
            setSettings((current) => ({ ...current, host: event.target.value }))
          }
          required
          disabled={loading || saving}
        />
        <TextField
          label="Porta SMTP"
          type="number"
          value={settings.port}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              port: Number(event.target.value),
            }))
          }
          slotProps={{ htmlInput: { min: 1, max: 65535 } }}
          required
          disabled={loading || saving}
        />
        <TextField
          label="Utente SMTP"
          value={settings.user}
          onChange={(event) =>
            setSettings((current) => ({ ...current, user: event.target.value }))
          }
          required
          disabled={loading || saving}
        />
        <TextField
          label="Password SMTP"
          type="password"
          value={settings.password}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          autoComplete="new-password"
          helperText={
            settings.passwordConfigured
              ? "Password configurata. Lascia vuoto per mantenere quella attuale."
              : "La password viene cifrata e non viene mai restituita alla pagina."
          }
          disabled={loading || saving}
        />
        <TextField
          label="Email mittente"
          type="email"
          value={settings.fromEmail}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              fromEmail: event.target.value,
            }))
          }
          required
          disabled={loading || saving}
        />
        <TextField
          label="Nome mittente"
          value={settings.fromName}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              fromName: event.target.value,
            }))
          }
          required
          disabled={loading || saving}
        />
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={settings.secure}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                secure: event.target.checked,
              }))
            }
            disabled={loading || saving}
          />
        }
        label="Connessione sicura (SMTP_SECURE)"
      />

      <Button
        type="submit"
        variant="contained"
        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
        disabled={loading || saving}
        sx={{ alignSelf: "flex-start" }}
      >
        Salva configurazione
      </Button>
    </Stack>
  );
}