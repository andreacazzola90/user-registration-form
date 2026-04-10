"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("andracazzola90@gmail.com");
  const [password, setPassword] = useState("farfalla24");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: "560px" }}>
      <section className="card" style={{ padding: "1.5rem" }}>
        <h1>Area Admin</h1>
        <p style={{ color: "var(--muted)" }}>
          Accedi per gestire iscrizioni, campi, export e QR.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: "0.7rem" }}
          >
            Email
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.35rem",
                padding: "0.65rem",
                borderRadius: "9px",
                border: "1px solid var(--line)",
              }}
              required
            />
          </label>

          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "0.7rem" }}
          >
            Password
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                marginTop: "0.35rem",
                padding: "0.65rem",
                borderRadius: "9px",
                border: "1px solid var(--line)",
              }}
              required
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Accesso..." : "Accedi"}
          </button>

          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        </form>
      </section>
    </main>
  );
}
