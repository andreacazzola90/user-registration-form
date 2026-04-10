import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { AdminDashboardTabs } from "@/components/AdminDashboardTabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistrationField, RegistrationRecord } from "@/lib/types";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableChartIcon from "@mui/icons-material/TableChart";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const [fieldsResponse, registrationsResponse, settingsResponse] =
    await Promise.all([
      supabase
        .from("registration_fields")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("event_settings")
        .select("lab_capacity")
        .limit(1)
        .maybeSingle(),
    ]);

  if (fieldsResponse.error) {
    throw new Error(fieldsResponse.error.message);
  }

  if (registrationsResponse.error) {
    throw new Error(registrationsResponse.error.message);
  }

  return {
    fields: (fieldsResponse.data ?? []) as RegistrationField[],
    registrations: (registrationsResponse.data ?? []) as RegistrationRecord[],
    capacity: settingsResponse.data?.lab_capacity ?? 50,
    email: user.email ?? "admin",
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <AdminDashboardClient>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Box
          component="section"
          sx={{
            background: "linear-gradient(135deg, #0f8a84 0%, #0d7473 100%)",
            color: "white",
            p: { xs: 2.5, md: 4 },
            mb: 3,
            borderRadius: 2,
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Chip
                icon={<QrCode2Icon />}
                label="Control Room"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: 600,
                  mb: 1,
                }}
              />
              <Typography variant="h4" sx={{ color: "white", mb: 1 }}>
                Dashboard Admin
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.85)" }}>
                Sessione: {data.email}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
              <Button
                href="/api/export/csv"
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                }}
              >
                Download CSV
              </Button>
              <Button
                href="/api/export/xlsx"
                variant="outlined"
                size="small"
                startIcon={<TableChartIcon />}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                }}
              >
                Download XLSX
              </Button>
              <Button
                href="/api/qr"
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                size="small"
                startIcon={<QrCode2Icon />}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                }}
              >
                Apri QR iscrizione
              </Button>
              <Button
                href="/"
                target="_blank"
                rel="noreferrer"
                variant="contained"
                size="small"
                endIcon={<OpenInNewIcon />}
                sx={{
                  backgroundColor: "white",
                  color: "#0f8a84",
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                }}
              >
                Vai al modulo pubblico
              </Button>
            </Stack>

            <Box sx={{ pt: 1 }}>
              <Chip
                label={`Capienza laboratori: ${data.capacity}`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Box>
          </Stack>
        </Box>

        <AdminDashboardTabs
          fields={data.fields}
          registrations={data.registrations}
          capacity={data.capacity}
        />
      </Box>
    </AdminDashboardClient>
  );
}
