"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import type { RegistrationField } from "@/lib/types";
import { TicketSelector } from "@/components/TicketSelector";

type RegistrationValues = Record<string, string | number>;

type LoadResponse = {
  ok: boolean;
  fields: RegistrationField[];
  form: {
    customCss: string;
    customCssEnabled: boolean;
  };
  registration: {
    id: string;
    status: "confirmed" | "waitlist";
    values: RegistrationValues;
  };
  message?: string;
};

const formTheme = createTheme({
  palette: {
    primary: { main: "#0f8a84" },
    background: { default: "#eef2f6", paper: "#ffffff" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-sans)",
    h4: { fontFamily: "var(--font-serif)", fontWeight: 700 },
  },
});

export default function ManageRegistrationPage() {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [customCss, setCustomCss] = useState("");
  const [customCssEnabled, setCustomCssEnabled] = useState(false);
  const [formData, setFormData] = useState<RegistrationValues>({});
  const [registrationId, setRegistrationId] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"confirmed" | "waitlist" | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [successPage, setSuccessPage] = useState<{
    type: "updated" | "deleted";
    text: string;
  } | null>(null);

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("id") ?? "";
    const t = searchParams.get("token") ?? "";

    if (!id || !t) {
      setMessage({ type: "error", text: "Link non valido o incompleto." });
      setIsLoading(false);
      return;
    }

    setRegistrationId(id);
    setToken(t);

    fetch(
      `/api/register/manage?id=${encodeURIComponent(id)}&token=${encodeURIComponent(t)}`,
    )
      .then(async (response) => {
        const data = (await response.json()) as LoadResponse;
        if (!response.ok || !data.ok) {
          throw new Error(
            data.message || "Impossibile caricare la prenotazione",
          );
        }

        setFields(data.fields.filter((field) => field.active));
        setCustomCss(data.form.customCss);
        setCustomCssEnabled(data.form.customCssEnabled);
        setFormData(data.registration.values);
        setStatus(data.registration.status);
      })
      .catch((error: unknown) => {
        const text =
          error instanceof Error
            ? error.message
            : "Impossibile caricare la prenotazione";
        setMessage({ type: "error", text });
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registrationId || !token) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/register/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: registrationId, token, payload: formData }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Errore durante l'aggiornamento");
      }

      setSuccessPage({
        type: "updated",
        text: data.message || "Prenotazione aggiornata con successo.",
      });
    } catch (error: unknown) {
      const text =
        error instanceof Error
          ? error.message
          : "Errore durante l'aggiornamento";
      setMessage({ type: "error", text });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!registrationId || !token) {
      return;
    }

    const confirmed = window.confirm(
      "Confermi la cancellazione della prenotazione?",
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/register/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: registrationId, token }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Errore durante la cancellazione");
      }

      setSuccessPage({
        type: "deleted",
        text: "Prenotazione cancellata con successo.",
      });
      setFields([]);
      setFormData({});
      setStatus("");
    } catch (error: unknown) {
      const text =
        error instanceof Error
          ? error.message
          : "Errore durante la cancellazione";
      setMessage({ type: "error", text });
    } finally {
      setIsDeleting(false);
    }
  }

  function renderField(field: RegistrationField) {
    const value = formData[field.key] ?? "";

    if (field.field_type === "tickets") {
      return (
        <TicketSelector
          id={field.key}
          tickets={field.options.filter(
            (option) => typeof option !== "string",
          )}
          value={String(value)}
          onChange={(nextValue) =>
            setFormData((prev) => ({ ...prev, [field.key]: nextValue }))
          }
        />
      );
    }

    const commonProps = {
      id: field.key,
      name: field.key,
      required: field.required,
      value,
      size: "small" as const,
      fullWidth: true,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        const nextValue =
          field.field_type === "number"
            ? Number(event.target.value || 0)
            : event.target.value;
        setFormData((prev) => ({ ...prev, [field.key]: nextValue }));
      },
      sx: {
        mt: 0.5,
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#fff",
        },
      },
    };

    if (field.field_type === "select") {
      return (
        <TextField {...commonProps} select>
          <MenuItem value="">Seleziona...</MenuItem>
          {field.options
            .filter((option): option is string => typeof option === "string")
            .map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
        </TextField>
      );
    }

    return (
      <TextField
        {...commonProps}
        type={field.field_type === "number" ? "number" : field.field_type}
        slotProps={
          field.field_type === "number" ? { htmlInput: { min: 0 } } : undefined
        }
      />
    );
  }

  if (successPage) {
    return (
      <ThemeProvider theme={formTheme}>
        <Box
          component="main"
          className="public-form-page"
          sx={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            p: 2,
          }}
        >
          <Box
            component="section"
            className="public-registration-result"
            data-result="confirmed"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            sx={{
              width: "100%",
              display: "grid",
              placeItems: "center",
              py: { xs: 2, md: 4 },
            }}
          >
            <Paper
              className="public-registration-result-card"
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 760,
                border: "1px solid #cdeee9",
                borderRadius: 3,
                p: { xs: 3, md: 6 },
                textAlign: "center",
                backgroundColor: "#f3fffd",
              }}
            >
              <Box
                className="public-registration-result-icon"
                aria-hidden="true"
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  backgroundColor: "#0f8a84",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  mx: "auto",
                  mb: 1.5,
                }}
              >
                OK
              </Box>
              <Typography
                className="public-registration-result-title"
                variant="h4"
                sx={{ mb: 1, color: "#1f2f35", fontSize: { xs: 30, md: 42 } }}
              >
                {successPage.type === "updated"
                  ? "Prenotazione aggiornata"
                  : "Prenotazione cancellata"}
              </Typography>
              <Typography
                className="public-registration-result-message"
                sx={{ color: "#2f4450", fontSize: { xs: 16, md: 18 } }}
              >
                {successPage.text}
              </Typography>
            </Paper>
          </Box>
          {customCssEnabled && customCss && (
            <style data-form-custom-css>{customCss}</style>
          )}
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={formTheme}>
      <main className="admin-backdrop min-h-screen public-form-page">
        <div className="public-shell public-form-content-inner py-8 md:py-12">
          <Box
            component="form"
            onSubmit={handleSave}
            aria-labelledby="registration-form-title"
            aria-describedby="registration-form-summary"
            sx={{ width: "100%", maxWidth: 740, mx: "auto" }}
          >
            <Paper
              elevation={0}
              sx={{ border: "1px solid #d9dfe7", p: { xs: 2.5, md: 4 } }}
            >
              <Typography id="registration-form-title" variant="h4" sx={{ mb: 1 }}>
                Gestisci la tua prenotazione
              </Typography>

              <Typography id="registration-form-summary" sx={{ color: "#62707c", mb: 2.5 }}>
                Qui puoi modificare i dati inviati o cancellare la prenotazione.
              </Typography>

              {status && (
                <Typography sx={{ color: "#4f616b", mb: 2 }}>
                  Stato attuale:{" "}
                  {status === "confirmed" ? "Confermata" : "Lista d'attesa"}
                </Typography>
              )}

              <Divider sx={{ mb: 2.5 }} />

              {isLoading && <Typography>Caricamento dati...</Typography>}

              {!isLoading && orderedFields.length > 0 && (
                <Stack spacing={2.25}>
                  {orderedFields.map((field) => (
                    <Box
                      key={field.id}
                      className="public-form-field"
                      sx={{
                        border: "1px solid #d7dee6",
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: "#f8fafc",
                      }}
                    >
                      <Typography
                        component="label"
                        id={`${field.key}-label`}
                        htmlFor={field.key}
                        sx={{ fontWeight: 700, color: "#2d3943", mb: 0.75 }}
                      >
                        {field.label}
                        {field.required ? " *" : ""}
                      </Typography>
                      {field.suggestion?.trim() && (
                        <Typography
                          className="public-field-suggestion"
                          sx={{
                            color: "#5d6870",
                            fontSize: 13,
                            lineHeight: 1.4,
                            mb: 0.75,
                          }}
                        >
                          {field.suggestion}
                        </Typography>
                      )}
                      {renderField(field)}
                    </Box>
                  ))}
                </Stack>
              )}

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{
                  alignItems: { xs: "stretch", md: "center" },
                  justifyContent: "space-between",
                  mt: 3,
                  pt: 2.5,
                  borderTop: "1px solid #dde3ea",
                }}
              >
                <Button
                  color="error"
                  variant="outlined"
                  type="button"
                  disabled={
                    isLoading || isDeleting || orderedFields.length === 0
                  }
                  onClick={handleDelete}
                  endIcon={
                    isDeleting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : undefined
                  }
                >
                  {isDeleting ? "Cancellazione..." : "Cancella prenotazione"}
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isLoading || isSaving || orderedFields.length === 0}
                  endIcon={
                    isSaving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : undefined
                  }
                  sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
                >
                  {isSaving ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              </Stack>
            </Paper>

            {message && (
              <Alert
                className={`public-form-alert public-form-alert-${message.type}`}
                severity={message.type}
                sx={{ mt: 2 }}
              >
                {message.text}
              </Alert>
            )}
          </Box>
          {customCssEnabled && customCss && (
            <style data-form-custom-css>{customCss}</style>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
}
