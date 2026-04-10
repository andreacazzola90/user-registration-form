"use client";

import { useState } from "react";
import type { RegistrationField } from "@/lib/types";
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

type Props = {
  initialFields: RegistrationField[];
};

const TYPES: RegistrationField["field_type"][] = [
  "text",
  "email",
  "tel",
  "number",
  "select",
];

export function AdminFieldManager({ initialFields }: Props) {
  const [fields, setFields] = useState(initialFields);
  const [status, setStatus] = useState<string | null>(null);

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

  async function addField() {
    const key = window.prompt("Chiave campo (es. municipality)");
    const label = window.prompt("Etichetta campo");

    if (!key || !label) {
      return;
    }

    const response = await fetch("/api/admin/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label }),
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
                <Typography sx={{ fontSize: 14, color: "#2d3943" }}>
                  Chiave: <strong>{field.key}</strong>
                </Typography>

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
                      const next = [...fields];
                      next[index] = {
                        ...field,
                        sort_order: Number(e.target.value),
                      };
                      setFields(next);
                    }}
                  />

                  <TextField
                    label="Label"
                    size="small"
                    fullWidth
                    value={field.label}
                    onChange={(e) => {
                      const next = [...fields];
                      next[index] = { ...field, label: e.target.value };
                      setFields(next);
                    }}
                  />

                  <TextField
                    select
                    label="Tipo"
                    size="small"
                    fullWidth
                    value={field.field_type}
                    onChange={(e) => {
                      const next = [...fields];
                      next[index] = {
                        ...field,
                        field_type: e.target
                          .value as RegistrationField["field_type"],
                      };
                      setFields(next);
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
                          const next = [...fields];
                          next[index] = {
                            ...field,
                            required: e.target.checked,
                          };
                          setFields(next);
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
                          const next = [...fields];
                          next[index] = { ...field, active: e.target.checked };
                          setFields(next);
                        }}
                        size="small"
                      />
                    }
                    label="Attivo"
                  />
                </Box>

                <TextField
                  label="Opzioni (separate da virgola)"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={field.options.join(",")}
                  onChange={(e) => {
                    const options = e.target.value
                      .split(",")
                      .map((opt) => opt.trim())
                      .filter(Boolean);

                    const next = [...fields];
                    next[index] = { ...field, options };
                    setFields(next);
                  }}
                  placeholder="opzione1,opzione2"
                />

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
