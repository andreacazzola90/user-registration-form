"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import LockResetIcon from "@mui/icons-material/LockReset";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export function AdminSecurityManager() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmation) {
      setError("Le nuove password non coincidono");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Impossibile aggiornare la password");
        return;
      }
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid #d9dfe7", mt: 3 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <LockResetIcon sx={{ color: "#0f8a84" }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Sicurezza account
            </Typography>
          </Stack>
          <Typography sx={{ color: "#62707c" }}>
            La modifica disconnette tutte le sessioni amministrative attive.
          </Typography>
          <TextField
            type="password"
            label="Password attuale"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
          <TextField
            type="password"
            label="Nuova password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            helperText="Almeno 14 caratteri, con maiuscole, minuscole, numeri e simboli."
            required
          />
          <TextField
            type="password"
            label="Conferma nuova password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            startIcon={<LockResetIcon />}
            disabled={loading}
            sx={{ alignSelf: "flex-start" }}
          >
            {loading ? "Aggiornamento..." : "Aggiorna password"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}