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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  );

  const requiredCount = orderedFields.filter((field) => field.required).length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
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
    } catch {
      setResult({ ok: false, message: "Errore inatteso. Riprova tra poco." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderField(field: RegistrationField) {
    const value = formData[field.key] ?? "";

    const commonProps = {
      id: field.key,
      name: field.key,
      required: field.required,
      value,
      size: "small" as const,
      fullWidth: true,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) =>
        setFormData((prev) => ({ ...prev, [field.key]: event.target.value })),
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
                  border: "1px solid #d7dee6",
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: "#f8fafc",
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
