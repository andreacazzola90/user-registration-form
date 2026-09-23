"use client";

import { useState } from "react";
import type { RegistrationField, TicketOption } from "@/lib/types";
import { RESERVED_STANDARD_KEYS } from "@/lib/registration-columns";
import {
  Box,
  Stack,
  Button,
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import IconButton from "@mui/material/IconButton";

type Props = {
  formId: string;
  initialFields: RegistrationField[];
};

const TYPES: RegistrationField["field_type"][] = [
  "text",
  "email",
  "tel",
  "number",
  "select",
  "tickets",
];

function isTicketOption(
  option: string | TicketOption,
): option is TicketOption {
  return typeof option !== "string";
}

export function AdminFieldManager({ formId, initialFields }: Props) {
  const [fields, setFields] = useState(initialFields);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadingTicketId, setUploadingTicketId] = useState<string | null>(
    null,
  );

  function updateField(index: number, patch: Partial<RegistrationField>) {
    setFields((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function ticketOptions(field: RegistrationField) {
    return field.options.filter(isTicketOption);
  }

  function updateTicket(
    fieldIndex: number,
    ticketId: string,
    patch: Partial<TicketOption>,
  ) {
    const field = fields[fieldIndex];
    updateField(fieldIndex, {
      options: ticketOptions(field).map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...patch } : ticket,
      ),
    });
  }

  function addTicket(fieldIndex: number) {
    const field = fields[fieldIndex];
    updateField(fieldIndex, {
      options: [
        ...ticketOptions(field),
        {
          id: crypto.randomUUID(),
          title: "",
          price: 0,
          imageUrl: "",
        },
      ],
    });
  }

  async function uploadTicketImage(
    fieldIndex: number,
    ticketId: string,
    file: File,
  ) {
    setUploadingTicketId(ticketId);
    setStatus(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: uploadData,
      });
      const data = (await response.json()) as {
        imageUrl?: string;
        message?: string;
      };

      if (!response.ok || !data.imageUrl) {
        setStatus(data.message ?? "Errore durante il caricamento");
        return;
      }

      updateTicket(fieldIndex, ticketId, { imageUrl: data.imageUrl });
    } finally {
      setUploadingTicketId(null);
    }
  }

  async function saveField(field: RegistrationField) {
    setStatus(null);
    const response = await fetch("/api/admin/fields", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(field),
    });

    const data = (await response.json()) as { message: string };
    setStatus(data.message);
  }

  async function moveField(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const current = fields[index];
    const target = fields[targetIndex];
    const swapped = {
      current: { ...current, sort_order: target.sort_order },
      target: { ...target, sort_order: current.sort_order },
    };

    setFields((prev) => {
      const next = [...prev];
      next[index] = swapped.target;
      next[targetIndex] = swapped.current;
      return next.sort((a, b) => a.sort_order - b.sort_order);
    });

    setStatus(null);
    await Promise.all([
      saveField(swapped.current),
      saveField(swapped.target),
    ]);
    setStatus("Ordine aggiornato");
  }

  async function addField() {
    const key = window.prompt("Chiave campo (es. municipality)");
    const label = window.prompt("Etichetta campo");

    if (!key || !label) {
      return;
    }

    if (RESERVED_STANDARD_KEYS.includes(key)) {
      setStatus(
        `Chiave riservata ai campi standard (${RESERVED_STANDARD_KEYS.join(", ")}): scegline un'altra`,
      );
      return;
    }

    const response = await fetch("/api/admin/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label, form_id: formId }),
    });

    const data = (await response.json()) as {
      message: string;
      field?: RegistrationField;
    };

    const createdField = data.field;
    if (createdField) {
      setFields((prev) =>
        [...prev, createdField].sort((a, b) => a.sort_order - b.sort_order),
      );
    }

    setStatus(data.message);
  }

  async function deleteField(fieldId: string, fieldLabel: string) {
    if (
      !window.confirm(`Sicuro di voler eliminare il campo "${fieldLabel}"?`)
    ) {
      return;
    }

    setStatus(null);
    const response = await fetch(
      `/api/admin/fields?id=${fieldId}&form_id=${formId}`,
      {
        method: "DELETE",
      },
    );

    const data = (await response.json()) as { message: string };

    if (response.ok) {
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
    }

    setStatus(data.message);
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ color: "#2d3943", fontWeight: 700 }}>
          Campi modulo registrazione
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addField}
          sx={{
            backgroundColor: "#0f8a84",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Aggiungi campo
        </Button>
      </Box>

      <Stack spacing={2}>
        {fields.map((field, index) => (
          <Card
            key={field.id}
            elevation={0}
            sx={{ border: "1px solid #d9dfe7" }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2.5}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 14, color: "#2d3943" }}>
                    Chiave: <strong>{field.key}</strong>
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => moveField(index, -1)}
                      aria-label={`Sposta su ${field.label}`}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={index === fields.length - 1}
                      onClick={() => moveField(index, 1)}
                      aria-label={`Sposta giù ${field.label}`}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                  }}
                >
                  <TextField
                    type="number"
                    label="Ordine"
                    size="small"
                    fullWidth
                    value={field.sort_order}
                    onChange={(e) => {
                      updateField(index, {
                        sort_order: Number(e.target.value),
                      });
                    }}
                  />

                  <TextField
                    label="Label"
                    size="small"
                    fullWidth
                    value={field.label}
                    onChange={(e) => {
                      updateField(index, { label: e.target.value });
                    }}
                  />

                  <TextField
                    select
                    label="Tipo"
                    size="small"
                    fullWidth
                    value={field.field_type}
                    onChange={(e) => {
                      updateField(index, {
                        field_type: e.target
                          .value as RegistrationField["field_type"],
                        options: [],
                      });
                    }}
                    slotProps={{
                      select: {
                        native: true,
                      },
                    }}
                  >
                    {TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </TextField>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.required}
                        onChange={(e) => {
                          updateField(index, {
                            required: e.target.checked,
                          });
                        }}
                        size="small"
                      />
                    }
                    label="Obbligatorio"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.active}
                        onChange={(e) => {
                          updateField(index, { active: e.target.checked });
                        }}
                        size="small"
                      />
                    }
                    label="Attivo"
                  />
                </Box>

                {field.field_type === "tickets" ? (
                  <Stack spacing={2}>
                    {ticketOptions(field).map((ticket) => (
                      <Box
                        key={ticket.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "96px minmax(0, 1fr) 140px auto",
                          },
                          gap: 1.5,
                          alignItems: "center",
                          p: 1.5,
                          border: "1px solid #d9dfe7",
                          borderRadius: 1,
                        }}
                      >
                        <Box
                          component="img"
                          src={ticket.imageUrl || undefined}
                          alt=""
                          sx={{
                            width: 96,
                            height: 72,
                            objectFit: "cover",
                            backgroundColor: "#eef2f6",
                            borderRadius: 1,
                          }}
                        />
                        <TextField
                          label="Titolo biglietto"
                          size="small"
                          value={ticket.title}
                          onChange={(event) =>
                            updateTicket(index, ticket.id, {
                              title: event.target.value,
                            })
                          }
                        />
                        <TextField
                          label="Prezzo EUR"
                          size="small"
                          type="number"
                          value={ticket.price}
                          onChange={(event) =>
                            updateTicket(index, ticket.id, {
                              price: Math.max(0, Number(event.target.value)),
                            })
                          }
                          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        />
                        <Button
                          color="error"
                          aria-label={`Elimina ${ticket.title || "biglietto"}`}
                          onClick={() =>
                            updateField(index, {
                              options: ticketOptions(field).filter(
                                (item) => item.id !== ticket.id,
                              ),
                            })
                          }
                        >
                          <DeleteIcon />
                        </Button>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          disabled={uploadingTicketId === ticket.id}
                          sx={{ gridColumn: { md: "2 / 4" } }}
                        >
                          {uploadingTicketId === ticket.id
                            ? "Caricamento..."
                            : ticket.imageUrl
                              ? "Cambia immagine"
                              : "Carica immagine"}
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                void uploadTicketImage(index, ticket.id, file);
                              }
                            }}
                          />
                        </Button>
                      </Box>
                    ))}
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => addTicket(index)}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Aggiungi biglietto
                    </Button>
                  </Stack>
                ) : (
                  <TextField
                    label="Opzioni (separate da virgola)"
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    value={field.options
                      .filter((option): option is string =>
                        typeof option === "string",
                      )
                      .join(",")}
                    onChange={(e) => {
                      const options = e.target.value
                        .split(",")
                        .map((opt) => opt.trim())
                        .filter(Boolean);
                      updateField(index, { options });
                    }}
                    placeholder="opzione1,opzione2"
                    disabled={field.field_type !== "select"}
                  />
                )}

                <Box>
                  <Button
                    variant="contained"
                    onClick={() => saveField(field)}
                    sx={{
                      backgroundColor: "#0f8a84",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Salva
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => deleteField(field.id, field.label)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      ml: 1,
                    }}
                  >
                    Elimina
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {status && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {status}
        </Alert>
      )}
    </Stack>
  );
}
