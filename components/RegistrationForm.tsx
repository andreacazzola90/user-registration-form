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
  labCapacityReached?: boolean;
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

const VALIDATION_SUMMARY_MESSAGE =
  "Controlla i campi evidenziati in rosso e correggi gli errori.";

const WALK_DETAILS = {
  date: "24/05/26",
  startTime: "10.00",
  checkInWindow: "9.30 - 10.00",
  meetingPoint: "CGP Monte di Malo",
  duration: "2 ore circa",
} as const;

const WALK_RECOMMENDED_ITEMS = [
  "Abbigliamento comodo e scarpe da ginnastica",
  "Acqua",
  "Passeggino da trekking",
  "Un bicchiere da casa per il ristoro",
] as const;

const visuallyHiddenSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  p: 0,
  m: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

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

export function RegistrationForm({
  fields,
  labCapacityReached = false,
}: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  );

  const requiredCount = orderedFields.filter((field) => field.required).length;

  function focusField(fieldKey: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      const fieldElement = document.getElementById(fieldKey);
      fieldElement?.focus();
    });
  }

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
    let firstInvalidFieldKey = "";

    orderedFields.forEach((field) => {
      const value = formData[field.key] ?? "";
      const errorMessage = validateField(field, value);

      if (errorMessage) {
        nextErrors[field.key] = errorMessage;
        if (!firstInvalidFieldKey) {
          firstInvalidFieldKey = field.key;
        }
      }
    });

    setFieldErrors(nextErrors);

    if (firstInvalidFieldKey) {
      focusField(firstInvalidFieldKey);
    }

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!validateForm()) {
      setResult({
        ok: false,
        message: VALIDATION_SUMMARY_MESSAGE,
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
    const fieldLabelId = `${field.key}-label`;
    const fieldHelperTextId = `${field.key}-helper-text`;

    const commonProps = {
      id: field.key,
      name: field.key,
      required: field.required,
      value,
      error: hasError,
      helperText: errorMessage || undefined,
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
          fontSize: 13,
          color: "#43515d",
        },
        "& .MuiFormHelperText-root.Mui-error": {
          color: "#b3261e",
        },
      },
    };

    if (field.field_type === "select") {
      return (
        <TextField
          {...commonProps}
          select
          slotProps={{
            formHelperText: {
              id: fieldHelperTextId,
              role: hasError ? ("alert" as const) : undefined,
              "aria-live": hasError ? ("assertive" as const) : undefined,
            },
            htmlInput: {
              "aria-labelledby": fieldLabelId,
              ...(hasError ? { "aria-describedby": fieldHelperTextId } : {}),
            },
          }}
        >
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
        slotProps={{
          formHelperText: {
            id: fieldHelperTextId,
            role: hasError ? ("alert" as const) : undefined,
            "aria-live": hasError ? ("assertive" as const) : undefined,
          },
          htmlInput: {
            "aria-labelledby": fieldLabelId,
            ...(hasError ? { "aria-describedby": fieldHelperTextId } : {}),
            ...(field.field_type === "number" ? { min: 0 } : {}),
          },
        }}
      />
    );
  }

  if (result?.ok || result?.fullPage) {
    const isErrorPage = !result.ok;

    return (
      <ThemeProvider theme={formTheme}>
        <Box
          component="section"
          role={isErrorPage ? "alert" : "status"}
          aria-live={isErrorPage ? "assertive" : "polite"}
          aria-atomic="true"
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
              aria-hidden="true"
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
            <Typography sx={{ color: "#2f4450", fontSize: { xs: 16, md: 18 } }}>
              {result.message}
            </Typography>
            {result.status && !isErrorPage && (
              <Typography sx={{ mt: 1.5, color: "#334955", fontSize: 14 }}>
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
        aria-labelledby="registration-form-title"
        aria-describedby="registration-form-summary registration-form-help"
        aria-busy={isSubmitting}
        noValidate
        sx={{ width: "100%", maxWidth: 740, mx: "auto" }}
      >
        <Paper
          elevation={0}
          sx={{ border: "1px solid #b9c5d1", p: { xs: 2.5, md: 4 } }}
        >
          <Typography id="registration-form-title" variant="h4" sx={{ mb: 1 }}>
            Passeggiata del 24 maggio 2026
          </Typography>
          <Typography
            id="registration-form-summary"
            sx={{ color: "#445867", mb: 2.5 }}
          >
            Modulo di iscrizione alla passeggiata itinerante per famiglie
            prevista per il 24 maggio 2026.
          </Typography>
          <Typography id="registration-form-help" sx={visuallyHiddenSx}>
            Compila il modulo. In caso di errore, il campo verra' evidenziato e
            verra' letto il messaggio associato.
          </Typography>

          <Divider sx={{ mb: 2.5 }} />

          <Box
            sx={{
              mb: 3,
              p: { xs: 2, md: 2.5 },
              borderRadius: 2,
              border: "1px solid #c9e4e1",
              backgroundColor: "#f4fbfa",
            }}
          >
            <Typography sx={{ fontSize: 24, fontWeight: 700, mb: 0.5 }}>
              Informazioni sulla passeggiata
            </Typography>
            {/* <Typography sx={{ color: "#334955", mb: 1.5 }}>
              Prenotazione confermata per il {WALK_DETAILS.date} alle ore{" "}
              {WALK_DETAILS.startTime}.
            </Typography> */}

            <Stack spacing={0.75} sx={{ mb: 1.5 }}>
              <Typography>
                <strong>Punto di ritrovo:</strong> {WALK_DETAILS.meetingPoint}
              </Typography>
              <Typography>
                <strong>Durata prevista:</strong> {WALK_DETAILS.duration}
              </Typography>
              <Typography>
                <strong>Iscrizioni e accoglienza:</strong> dalle ore{" "}
                {WALK_DETAILS.checkInWindow}
              </Typography>
              <Typography>
                <strong>Partenza del gruppo:</strong> ore{" "}
                {WALK_DETAILS.startTime}
              </Typography>
              {/* <Typography>
                <strong>Numero partecipanti:</strong> compilare i campi del
                modulo qui sotto.
              </Typography> */}
            </Stack>

            {/* <Typography sx={{ color: "#334955", mb: 0.75 }}>
              Chiediamo puntualita': trattandosi di una passeggiata itinerante,
              si partira' tutti insieme per garantire ai bambini il regolare
              svolgimento dei laboratori.
            </Typography>

            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              Si consiglia di portare:
            </Typography>
            <Box
              component="ul"
              sx={{ pl: 2.5, mt: 0, mb: 1.5, color: "#334955" }}
            >
              {WALK_RECOMMENDED_ITEMS.map((item) => (
                <Box key={item} component="li" sx={{ mb: 0.25 }}>
                  {item}
                </Box>
              ))}
            </Box>

            <Typography sx={{ color: "#334955", mb: 0.5 }}>
              Per il pranzo e' disponibile il ricco stand della Sagra di San
              Giuseppe nel piazzale della Chiesa.
            </Typography>
            <Typography sx={{ color: "#334955" }}>
              In caso di necessita' o variazioni, rispondi all&apos;email di
              conferma per essere ricontattato dallo staff di Tra i fili
              d&apos;erba.
            </Typography> */}
          </Box>

          <Typography sx={{ fontSize: 24, fontWeight: 700, mb: 0.75 }}>
            Compila il form di registrazione
          </Typography>
          <Typography sx={{ color: "#445867", mb: 2.5 }}>
            Compila i campi seguenti per completare l&apos;iscrizione.
          </Typography>

          {labCapacityReached && (
            <Alert severity="warning" sx={{ mb: 2.5 }}>
              Per il laboratorio e&apos; stato raggiunto il numero massimo di
              partecipanti. Le nuove iscrizioni verranno inserite in lista
              d&apos;attesa.
            </Alert>
          )}

          <Stack spacing={2.25}>
            {orderedFields.map((field) => (
              <Box
                key={field.id}
                sx={{
                  border: fieldErrors[field.key]
                    ? "1px solid #b3261e"
                    : "1px solid #c2ccd8",
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: fieldErrors[field.key]
                    ? "#fff1f1"
                    : "#f8fafc",
                }}
              >
                <Typography
                  id={`${field.key}-label`}
                  component="label"
                  htmlFor={field.key}
                  sx={{ fontWeight: 700, color: "#1f2d37", mb: 0.75 }}
                >
                  {field.label}
                  {field.required ? " *" : ""}
                  {field.required && (
                    <Box component="span" sx={visuallyHiddenSx}>
                      campo obbligatorio
                    </Box>
                  )}
                </Typography>
                {renderField(field)}
              </Box>
            ))}
          </Stack>

          {result?.ok === false &&
            !result.fullPage &&
            result.message === VALIDATION_SUMMARY_MESSAGE && (
              <Alert
                severity="error"
                role="alert"
                aria-live="assertive"
                sx={{ mt: 3, mb: 2 }}
              >
                {result.message}
              </Alert>
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
            <Typography sx={{ color: "#435764", fontSize: 14 }}>
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

        {result && result.message !== VALIDATION_SUMMARY_MESSAGE && (
          <Alert
            severity={result.ok ? "success" : "error"}
            role={result.ok ? "status" : "alert"}
            aria-live={result.ok ? "polite" : "assertive"}
            sx={{ mt: 2 }}
          >
            {result.message}
          </Alert>
        )}

        <Box aria-live="polite" sx={visuallyHiddenSx}>
          {isSubmitting ? "Invio in corso" : ""}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
