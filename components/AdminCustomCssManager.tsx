"use client";

import { FormEvent, useState } from "react";
import CodeIcon from "@mui/icons-material/Code";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type Props = {
  formId: string;
  initialCss: string;
  initialEnabled: boolean;
  onSaved: (customCss: string, enabled: boolean) => void;
};

const CSS_PLACEHOLDER = `.public-form-page {
  background: #f5f5f5;
}

.public-form-content-pane {
  /* Inserisci qui le tue regole */
}`;

export function AdminCustomCssManager({
  formId,
  initialCss,
  initialEnabled,
  onSaved,
}: Props) {
  const [customCss, setCustomCss] = useState(initialCss);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId,
          custom_css: customCss,
          custom_css_enabled: enabled,
        }),
      });
      const data = (await response.json()) as { message?: string };

      setStatus({
        type: response.ok ? "success" : "error",
        message:
          data.message ??
          (response.ok
            ? "CSS personalizzato aggiornato"
            : "Errore durante il salvataggio"),
      });
      if (response.ok) {
        onSaved(customCss, enabled);
      }
    } catch {
      setStatus({
        type: "error",
        message: "Errore durante il salvataggio del CSS",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <CodeIcon sx={{ color: "#0f8a84" }} />
            <Typography variant="h5" sx={{ color: "#2d3943", fontWeight: 700 }}>
              Style personalizzato
            </Typography>
          </Stack>
          <Typography sx={{ color: "#62707c", mt: 1 }}>
            Le regole vengono applicate soltanto alla pagina pubblica di questo
            form e hanno precedenza sugli stili base.
          </Typography>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                />
              }
              label={enabled ? "Stili attivi" : "Stili disattivati"}
            />
            <TextField
              label="Regole CSS"
              value={customCss}
              onChange={(event) => setCustomCss(event.target.value)}
              placeholder={CSS_PLACEHOLDER}
              multiline
              minRows={18}
              maxRows={32}
              fullWidth
              slotProps={{
                htmlInput: {
                  spellCheck: false,
                  maxLength: 50_000,
                },
              }}
              sx={{
                "& textarea": {
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 14,
                  lineHeight: 1.6,
                  tabSize: 2,
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<SaveIcon />}
              sx={{ alignSelf: "flex-start" }}
            >
              {loading ? "Salvataggio..." : "Salva Style"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {status && <Alert severity={status.type}>{status.message}</Alert>}
    </Stack>
  );
}