"use client";

import { useState } from "react";
import type { FormConfig } from "@/lib/types";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

type Props = {
  initialForms: FormConfig[];
};

type CreateFormPayload = {
  slug: string;
  title: string;
  description: string;
  lab_capacity: number;
};

export function AdminFormsManager({ initialForms }: Props) {
  const [forms, setForms] = useState<FormConfig[]>(initialForms);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CreateFormPayload>({
    slug: "",
    title: "",
    description: "",
    lab_capacity: 50,
  });

  function openDialog() {
    setDraft({ slug: "", title: "", description: "", lab_capacity: 50 });
    setCreateError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isCreating) return;
    setDialogOpen(false);
  }

  function handleTitleChange(value: string) {
    const autoSlug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    setDraft((prev) => ({
      ...prev,
      title: value,
      slug:
        prev.slug === "" || prev.slug === autoSlug.slice(0, -1)
          ? autoSlug
          : prev.slug,
    }));
  }

  async function handleCreate() {
    if (!draft.title.trim() || !draft.slug.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = (await response.json()) as {
        message: string;
        form?: FormConfig;
      };

      if (!response.ok) {
        setCreateError(data.message);
        return;
      }

      if (data.form) {
        setForms((prev) => [data.form!, ...prev]);
      }

      setDialogOpen(false);
    } catch {
      setCreateError("Errore di rete. Riprova.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ color: "#1f2f35" }}>
          Form attivi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openDialog}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Crea nuovo form
        </Button>
      </Stack>

      {forms.length === 0 && (
        <Typography sx={{ color: "#62707c" }}>
          Nessun form creato. Clicca su &ldquo;Crea nuovo form&rdquo; per
          iniziare.
        </Typography>
      )}

      <Stack spacing={2}>
        {forms.map((form) => (
          <Card
            key={form.id}
            elevation={0}
            sx={{ border: "1px solid #d9dfe7", borderRadius: 2 }}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
                py: "14px !important",
                px: 2.5,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", mb: 0.5 }}
                >
                  <Typography
                    sx={{ fontWeight: 700, color: "#1f2f35", fontSize: 16 }}
                  >
                    {form.title}
                  </Typography>
                  <Chip
                    label={form.is_active ? "Attivo" : "Inattivo"}
                    size="small"
                    color={form.is_active ? "success" : "default"}
                    sx={{ fontWeight: 600, fontSize: 11 }}
                  />
                </Stack>
                {form.description && (
                  <Typography sx={{ color: "#62707c", fontSize: 13 }}>
                    {form.description}
                  </Typography>
                )}
                <Typography sx={{ color: "#8898a6", fontSize: 12, mt: 0.25 }}>
                  /forms/{form.slug}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  href={`/forms/${form.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  size="small"
                  endIcon={<OpenInNewIcon />}
                  sx={{ textTransform: "none" }}
                >
                  Anteprima
                </Button>
                <Button
                  href={`/admin/dashboard/${form.id}`}
                  variant="contained"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Gestisci
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ fontFamily: "var(--font-serif)", fontWeight: 700 }}>
          Crea nuovo form
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {createError && <Alert severity="error">{createError}</Alert>}
            <TextField
              label="Titolo"
              value={draft.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Slug (URL)"
              value={draft.slug}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, slug: e.target.value }))
              }
              fullWidth
              size="small"
              required
              helperText={`Sarà accessibile su /forms/${draft.slug || "..."}`}
            />
            <TextField
              label="Descrizione (opzionale)"
              value={draft.description}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, description: e.target.value }))
              }
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <TextField
              label="Capienza laboratori"
              type="number"
              value={draft.lab_capacity}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  lab_capacity: Number(e.target.value) || 50,
                }))
              }
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog} disabled={isCreating}>
            Annulla
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={isCreating || !draft.title.trim() || !draft.slug.trim()}
            endIcon={
              isCreating ? (
                <CircularProgress size={18} color="inherit" />
              ) : undefined
            }
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {isCreating ? "Creazione..." : "Crea form"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
