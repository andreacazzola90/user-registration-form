"use client";

import { FormEvent, useState } from "react";
import type { FormConfig } from "@/lib/types";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type Props = {
  form: FormConfig;
};

export function AdminFormContentManager({ form }: Props) {
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description);
  const [infoTitle, setInfoTitle] = useState(form.info_title);
  const [infoDescription, setInfoDescription] = useState(form.info_description);
  const [registrationTitle, setRegistrationTitle] = useState(
    form.registration_title,
  );
  const [registrationDescription, setRegistrationDescription] = useState(
    form.registration_description,
  );
  const [submitNote, setSubmitNote] = useState(form.submit_note);
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          title,
          description,
          info_title: infoTitle,
          info_description: infoDescription,
          registration_title: registrationTitle,
          registration_description: registrationDescription,
          submit_note: submitNote,
          slider_data: form.slider_data ?? [],
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus({
          type: "error",
          message: data.message ?? "Errore durante il salvataggio",
        });
        return;
      }

      setStatus({
        type: "success",
        message: data.message ?? "Contenuti aggiornati",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Errore di rete durante il salvataggio",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid #d9dfe7" }}>
      <CardContent>
        <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
          <Typography variant="h5" sx={{ color: "#2d3943", fontWeight: 700 }}>
            Testi del form pubblico
          </Typography>

          <TextField
            label="Titolo principale"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            size="small"
            fullWidth
            required
          />

          <TextField
            label="Paragrafo introduttivo"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />

          <TextField
            label="Titolo box informazioni"
            value={infoTitle}
            onChange={(event) => setInfoTitle(event.target.value)}
            size="small"
            fullWidth
            required
          />

          <TextField
            label="Descrizione box informazioni"
            value={infoDescription}
            onChange={(event) => setInfoDescription(event.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={6}
          />

          <TextField
            label="Titolo sezione registrazione"
            value={registrationTitle}
            onChange={(event) => setRegistrationTitle(event.target.value)}
            size="small"
            fullWidth
            required
          />

          <TextField
            label="Paragrafo sezione registrazione"
            value={registrationDescription}
            onChange={(event) => setRegistrationDescription(event.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
            required
          />

          <TextField
            label="Nota sotto pulsante invio"
            value={submitNote}
            onChange={(event) => setSubmitNote(event.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
            required
          />

          {status && <Alert severity={status.type}>{status.message}</Alert>}

          <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              endIcon={
                loading ? <CircularProgress size={18} color="inherit" /> : null
              }
              sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
            >
              {loading ? "Salvataggio..." : "Salva contenuti"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
