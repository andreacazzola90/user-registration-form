"use client";

import { useEffect, useState, type FormEvent } from "react";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DEFAULT_FORM_EMAIL_TEMPLATES,
  type FormEmailTemplates,
} from "@/lib/mail/email-template-defaults";

export function AdminEmailTemplatesManager({
  formId,
}: {
  formId: string;
}) {
  const [templates, setTemplates] = useState<FormEmailTemplates>(
    DEFAULT_FORM_EMAIL_TEMPLATES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/admin/email-templates?form_id=${encodeURIComponent(formId)}`,
        );
        const data = (await response.json()) as
          | FormEmailTemplates
          | { message?: string };
        if (!response.ok) {
          throw new Error(
            "message" in data ? data.message : "Caricamento testi fallito",
          );
        }
        if (active) setTemplates(data as FormEmailTemplates);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossibile caricare i testi email",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTemplates();
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
      const response = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...templates, formId }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Salvataggio testi fallito");
      }
      setSuccess(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile salvare i testi email",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateTemplate(key: keyof FormEmailTemplates, value: string) {
    setTemplates((current) => ({ ...current, [key]: value }));
  }

  const disabled = loading || saving;
  const placeholders =
    "Segnaposto disponibili: {{nome}}, {{numero_partecipanti}}, {{email_contatto}}, {{riepilogo}}, {{link_cancellazione}}";

  return (
    <Stack
      component="form"
      spacing={3}
      onSubmit={handleSubmit}
      sx={{ maxWidth: 900 }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <AlternateEmailIcon sx={{ color: "#0f8a84" }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Testi delle email
        </Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">Testi email salvati</Alert>}

      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Conferma iscrizione
        </Typography>
        <TextField
          label="Oggetto"
          value={templates.confirmationSubject}
          onChange={(event) =>
            updateTemplate("confirmationSubject", event.target.value)
          }
          required
          disabled={disabled}
          fullWidth
        />
        <TextField
          label="Corpo email"
          value={templates.confirmationBody}
          onChange={(event) =>
            updateTemplate("confirmationBody", event.target.value)
          }
          helperText={placeholders}
          required
          disabled={disabled}
          multiline
          minRows={10}
          fullWidth
        />
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Lista d&apos;attesa
        </Typography>
        <TextField
          label="Oggetto"
          value={templates.waitlistSubject}
          onChange={(event) => updateTemplate("waitlistSubject", event.target.value)}
          required
          disabled={disabled}
          fullWidth
        />
        <TextField
          label="Corpo email"
          value={templates.waitlistBody}
          onChange={(event) => updateTemplate("waitlistBody", event.target.value)}
          helperText={placeholders}
          required
          disabled={disabled}
          multiline
          minRows={10}
          fullWidth
        />
      </Stack>

      <Button
        type="submit"
        variant="contained"
        startIcon={
          saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
        }
        disabled={disabled}
        sx={{ alignSelf: "flex-start" }}
      >
        Salva testi
      </Button>
    </Stack>
  );
}