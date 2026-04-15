"use client";

import { FormEvent, useMemo, useState } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import type { RegistrationField, RegistrationStatus } from "@/lib/types";

type Props = {
  fields: RegistrationField[];
};

type SubmitResult = {
  ok: boolean;
  status?: RegistrationStatus;
  message: string;
  fullPage?: boolean;
};

const NUMBER_KEYS = new Set([
  "children_under_3",
  "children_over_3_labs",
  "adults",
]);

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

export function RegistrationForm({ fields }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  );

  const requiredCount = orderedFields.filter((field) => field.required).length;

  function validateField(field: RegistrationField, rawValue: string) {
    const value = rawValue.trim();

    if (field.required && !value) {
      return "Questo campo e' obbligatorio.";
    }

    if (!value) {
      return "";
    }

    if (field.field_type === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
      if (!emailPattern.test(value)) {
        return "Inserisci un indirizzo email valido (es. nome@dominio.it).";
      }
    }

    if (field.field_type === "tel") {
      const digitsOnly = value.replace(/\D/g, "");
      const phonePattern = /^\+?[0-9()\-\s.]+$/;

      if (
        !phonePattern.test(value) ||
        digitsOnly.length < 7 ||
        digitsOnly.length > 15
      ) {
        return "Inserisci un numero di telefono valido (7-15 cifre).";
      }
    }

    return "";
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    orderedFields.forEach((field) => {
      const value = formData[field.key] ?? "";
      const errorMessage = validateField(field, value);

      if (errorMessage) {
        nextErrors[field.key] = errorMessage;
      }
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!validateForm()) {
      setResult({
        ok: false,
        message:
          "Controlla i campi evidenziati in rosso e correggi gli errori.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, string | number> = {};

      orderedFields.forEach((field) => {
        const value = formData[field.key] ?? "";
        payload[field.key] = NUMBER_KEYS.has(field.key)
          ? Number(value || 0)
          : value.trim();
      });

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as SubmitResult;

      if (!response.ok) {
        setResult({
          ok: false,
          message: data.message || "Errore durante la registrazione",
        });
        return;
      }

      setResult({
        ok: true,
        status: data.status,
        message: data.message,
      });
      setFormData({});
      setFieldErrors({});
    } catch {
      setResult({
        ok: false,
        fullPage: true,
        message: "Errore inatteso. Riprova tra poco.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderField(field: RegistrationField) {
    const value = formData[field.key] ?? "";
    const errorMessage = fieldErrors[field.key] ?? "";
    const hasError = Boolean(errorMessage);

    const commonProps = {
      id: field.key,
      name: field.key,
      required: field.required,
      value,
      error: hasError,
      helperText: errorMessage || " ",
      size: "small" as const,
      fullWidth: true,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        const nextValue = event.target.value;

        setFormData((prev) => ({ ...prev, [field.key]: nextValue }));

        setFieldErrors((prev) => {
          if (!prev[field.key]) {
            return prev;
          }

          const nextError = validateField(field, nextValue);
          if (nextError) {
            return { ...prev, [field.key]: nextError };
          }

          const { [field.key]: _removed, ...rest } = prev;
          return rest;
        });
      },
      onBlur: () => {
        const nextError = validateField(field, value);
        setFieldErrors((prev) => ({
          ...prev,
          [field.key]: nextError,
        }));
      },
      sx: {
        mt: 0.5,
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#fff",
        },
        "& .MuiFormHelperText-root": {
          mt: 0.75,
          fontSize: 12,
        },
      },
    };

    if (field.field_type === "select") {
      return (
        <TextField {...commonProps} select>
          <MenuItem value="">Seleziona...</MenuItem>
          {field.options.map((option) => (
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

  if (result?.ok || result?.fullPage) {
    const isErrorPage = !result.ok;

    return (
      <ThemeProvider theme={formTheme}>
        <Box
          sx={{
            minHeight: "100vh",
            width: "100%",
            display: "grid",
            placeItems: "center",
            px: 2,
            py: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: 760,
              border: isErrorPage ? "1px solid #ffd6d6" : "1px solid #cdeee9",
              borderRadius: 3,
              p: { xs: 3, md: 6 },
              textAlign: "center",
              backgroundColor: isErrorPage ? "#fff8f8" : "#f3fffd",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: isErrorPage ? "#d32f2f" : "#0f8a84",
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
              variant="h4"
              sx={{ mb: 1, color: "#1f2f35", fontSize: { xs: 30, md: 42 } }}
            >
              {isErrorPage
                ? "Errore durante l'iscrizione"
                : "Iscrizione avvenuta con successo"}
            </Typography>
            <Typography sx={{ color: "#3e555f", fontSize: { xs: 16, md: 18 } }}>
              {result.message}
            </Typography>
            {result.status && !isErrorPage && (
              <Typography sx={{ mt: 1.5, color: "#4d5e66", fontSize: 14 }}>
                Stato registrazione:{" "}
                {result.status === "confirmed"
                  ? "Confermata"
                  : "Lista d'attesa"}
              </Typography>
            )}
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={formTheme}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: "100%", maxWidth: 740, mx: "auto" }}
      >
        <Paper
          elevation={0}
          sx={{ border: "1px solid #d9dfe7", p: { xs: 2.5, md: 4 } }}
        >
          <Typography variant="h4" sx={{ mb: 1 }}>
            Personal information
          </Typography>
          <Typography sx={{ color: "#5f6c76", mb: 2.5 }}>
            All fields marked with a (*) are required. Campi richiesti:{" "}
            {requiredCount}.
          </Typography>

          <Divider sx={{ mb: 2.5 }} />

          <Typography sx={{ fontSize: 24, fontWeight: 700, mb: 0.75 }}>
            About you
          </Typography>
          <Typography sx={{ color: "#62707c", mb: 2.5 }}>
            Compila i campi seguenti per completare l&apos;iscrizione.
          </Typography>

          <Stack spacing={2.25}>
            {orderedFields.map((field) => (
              <Box
                key={field.id}
                sx={{
                  border: fieldErrors[field.key]
                    ? "1px solid #d32f2f"
                    : "1px solid #d7dee6",
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: fieldErrors[field.key]
                    ? "#fff6f6"
                    : "#f8fafc",
                }}
              >
                <Typography
                  sx={{ fontWeight: 700, color: "#2d3943", mb: 0.75 }}
                >
                  {field.label}
                  {field.required ? " *" : ""}
                </Typography>
                {renderField(field)}
              </Box>
            ))}
          </Stack>

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
            <Typography sx={{ color: "#61707b", fontSize: 14 }}>
              Riceverai una mail di conferma o lista d&apos;attesa.
            </Typography>
            <Button
              variant="contained"
              type="submit"
              disabled={isSubmitting}
              endIcon={<ArrowForwardIcon />}
              sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
            >
              {isSubmitting ? "Invio in corso..." : "Conferma iscrizione"}
            </Button>
          </Stack>
        </Paper>

        {result && (
          <Alert severity={result.ok ? "success" : "error"} sx={{ mt: 2 }}>
            {result.message}
          </Alert>
        )}
      </Box>
    </ThemeProvider>
  );
}
