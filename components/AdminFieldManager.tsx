"use client";

import { useState } from "react";
import type { RegistrationField } from "@/lib/types";

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
    <section className="card" style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Campi modulo registrazione</h2>
        <button className="btn btn-secondary" onClick={addField} type="button">
          Aggiungi campo
        </button>
      </div>

      <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.9rem" }}>
        {fields.map((field, index) => (
          <article
            key={field.id}
            style={{
              border: "1px solid var(--line)",
              borderRadius: "10px",
              padding: "0.8rem",
              display: "grid",
              gap: "0.65rem",
            }}
          >
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
              Chiave: <strong>{field.key}</strong>
            </p>

            <label style={{ display: "grid", gap: "0.35rem" }}>
              Ordine
              <input
                type="number"
                value={field.sort_order}
                onChange={(e) => {
                  const next = [...fields];
                  next[index] = {
                    ...field,
                    sort_order: Number(e.target.value),
                  };
                  setFields(next);
                }}
                style={{ width: "92px" }}
              />
            </label>

            <label style={{ display: "grid", gap: "0.35rem" }}>
              Label
              <input
                value={field.label}
                onChange={(e) => {
                  const next = [...fields];
                  next[index] = { ...field, label: e.target.value };
                  setFields(next);
                }}
              />
            </label>

            <label style={{ display: "grid", gap: "0.35rem" }}>
              Tipo
              <select
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
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => {
                  const next = [...fields];
                  next[index] = { ...field, required: e.target.checked };
                  setFields(next);
                }}
              />
              Obbligatorio
            </label>

            <label
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={field.active}
                onChange={(e) => {
                  const next = [...fields];
                  next[index] = { ...field, active: e.target.checked };
                  setFields(next);
                }}
              />
              Attivo
            </label>

            <label style={{ display: "grid", gap: "0.35rem" }}>
              Opzioni (separate da virgola)
              <input
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
            </label>

            <div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => saveField(field)}
              >
                Salva
              </button>
            </div>
          </article>
        ))}
      </div>

      {status && (
        <p style={{ marginBottom: 0, color: "var(--muted)" }}>{status}</p>
      )}
    </section>
  );
}
