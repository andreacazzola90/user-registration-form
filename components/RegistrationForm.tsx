"use client";

import { FormEvent, useMemo, useState } from "react";
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

export function RegistrationForm({ fields }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.sort_order - b.sort_order),
    [fields],
  );

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
    const common = {
      id: field.key,
      name: field.key,
      required: field.required,
      value: formData[field.key] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFormData((prev) => ({ ...prev, [field.key]: e.target.value })),
      style: {
        width: "100%",
        padding: "0.65rem 0.75rem",
        border: "1px solid var(--line)",
        borderRadius: "9px",
        marginTop: "0.35rem",
      },
    };

    if (field.field_type === "select") {
      return (
        <select {...common}>
          <option value="">Seleziona...</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        {...common}
        type={field.field_type === "number" ? "number" : field.field_type}
        min={field.field_type === "number" ? 0 : undefined}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: "1rem" }}>Modulo di Iscrizione</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "0.9rem",
          maxWidth: "560px",
        }}
      >
        {orderedFields.map((field) => (
          <label key={field.id} htmlFor={field.key}>
            <span style={{ fontWeight: 600 }}>{field.label}</span>
            {renderField(field)}
          </label>
        ))}
      </div>

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.8rem",
        }}
      >
        <button
          className="btn btn-primary"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Invio in corso..." : "Conferma iscrizione"}
        </button>
      </div>

      {result && (
        <p
          style={{
            marginTop: "1rem",
            padding: "0.7rem 0.8rem",
            borderRadius: "9px",
            background: result.ok
              ? "rgba(23, 92, 76, 0.12)"
              : "rgba(173, 58, 47, 0.12)",
            color: result.ok ? "var(--accent)" : "var(--danger)",
          }}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
