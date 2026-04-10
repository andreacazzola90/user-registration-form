"use client";

import { FormEvent, useState } from "react";

type Props = {
  initialLabCapacity: number;
  confirmedLabChildren: number;
};

export function AdminRulesManager({
  initialLabCapacity,
  confirmedLabChildren,
}: Props) {
  const [labCapacity, setLabCapacity] = useState(initialLabCapacity);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lab_capacity: Number(labCapacity) }),
      });

      const data = (await response.json()) as { message: string };
      setStatus(data.message);
    } catch {
      setStatus("Errore durante il salvataggio delle regole");
    } finally {
      setLoading(false);
    }
  }

  const reachedLimit = confirmedLabChildren >= labCapacity;

  return (
    <section className="card" style={{ padding: "1rem" }}>
      <h2 style={{ marginTop: 0, marginBottom: "0.8rem" }}>Regole</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "0.8rem", maxWidth: "420px" }}
      >
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Limite massimo bambini nei laboratori
          <input
            type="number"
            min={1}
            value={labCapacity}
            onChange={(e) => setLabCapacity(Number(e.target.value))}
            style={{ width: "100%" }}
            required
          />
        </label>

        <p style={{ margin: 0, color: "var(--muted)" }}>
          Bambini confermati nei laboratori:{" "}
          <strong>{confirmedLabChildren}</strong>
        </p>

        <p
          style={{
            margin: 0,
            color: reachedLimit ? "var(--danger)" : "var(--accent)",
            fontWeight: 600,
          }}
        >
          {reachedLimit
            ? "Limite raggiunto: nuove iscrizioni andranno in lista d'attesa"
            : "Limite non raggiunto: nuove iscrizioni verranno confermate"}
        </p>

        <div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Salvataggio..." : "Salva regole"}
          </button>
        </div>
      </form>

      {status && (
        <p style={{ marginBottom: 0, color: "var(--muted)" }}>{status}</p>
      )}
    </section>
  );
}
