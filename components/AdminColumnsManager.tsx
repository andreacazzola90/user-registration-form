"use client";

import { useState } from "react";
import type { DisplayColumnSetting, RegistrationField } from "@/lib/types";
import {
  resolveColumnSettingsForEditing,
  type EditableColumn,
} from "@/lib/registration-columns";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

type Props = {
  formId: string;
  fields: RegistrationField[];
  initialSettings: DisplayColumnSetting[] | null;
  supportsLabCapacity: boolean;
  onSaved: (columns: DisplayColumnSetting[]) => void;
};

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function AdminColumnsManager({
  formId,
  fields,
  initialSettings,
  supportsLabCapacity,
  onSaved,
}: Props) {
  const [columns, setColumns] = useState<EditableColumn[]>(() =>
    resolveColumnSettingsForEditing(fields, initialSettings, {
      includeLabColumns: supportsLabCapacity,
    }),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleVisible(index: number) {
    setColumns((current) => {
      const next = [...current];
      next[index] = { ...next[index], visible: !next[index].visible };
      return next;
    });
  }

  function move(index: number, direction: -1 | 1) {
    setColumns((current) => moveItem(current, index, direction));
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const payload: DisplayColumnSetting[] = columns.map((column) => ({
        key: column.key,
        source: column.source,
        visible: column.visible,
      }));

      const response = await fetch("/api/admin/forms/columns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_id: formId, columns: payload }),
      });

      const data = (await response.json()) as { message: string };
      setStatus(data.message);

      if (response.ok) {
        onSaved(payload);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ color: "#2d3943", fontWeight: 700 }}>
          Colonne tabella e CSV
        </Typography>
        <Typography sx={{ color: "#62707c", fontSize: 14, mt: 0.5 }}>
          Scegli quali colonne mostrare nella tabella iscrizioni e in che
          ordine. La stessa configurazione viene usata per gli export CSV e
          XLSX di questo form.
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {columns.map((column, index) => (
          <Card
            key={`${column.source}:${column.key}`}
            elevation={0}
            sx={{ border: "1px solid #d9dfe7" }}
          >
            <CardContent
              sx={{
                p: 1.5,
                "&:last-child": { pb: 1.5 },
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={column.visible}
                    onChange={() => toggleVisible(index)}
                    size="small"
                  />
                }
                label={
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 14, color: "#2d3943" }}>
                      {column.label}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#8a97a3" }}>
                      {column.source === "field" ? "campo modulo" : "standard"}
                    </Typography>
                  </Stack>
                }
              />

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Sposta su ${column.label}`}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={index === columns.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Sposta giù ${column.label}`}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box>
        <Button
          variant="contained"
          disabled={saving}
          onClick={save}
          sx={{
            backgroundColor: "#0f8a84",
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {saving ? "Salvataggio..." : "Salva visualizzazione"}
        </Button>
      </Box>

      {status && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {status}
        </Alert>
      )}
    </Stack>
  );
}
