import { redirect, notFound } from "next/navigation";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { AdminDashboardTabs } from "@/components/AdminDashboardTabs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail } from "@/lib/admin-session";
import type {
  FormConfig,
  RegistrationField,
  RegistrationRecord,
} from "@/lib/types";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TableChartIcon from "@mui/icons-material/TableChart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ formId: string }>;
};

async function getFormDashboardData(formId: string) {
  const email = await getAdminEmail();

  if (!email) {
    redirect("/admin/login");
  }

  const supabase = createSupabaseAdminClient();

  const [
    formResponse,
    fieldsResponse,
    registrationsResponse,
    settingsResponse,
  ] = await Promise.all([
    supabase.from("forms").select("*").eq("id", formId).maybeSingle(),
    supabase
      .from("registration_fields")
      .select("*")
      .eq("form_id", formId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("registrations")
      .select("*")
      .eq("form_id", formId)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_settings")
      .select("lab_capacity, max_participants, registrations_close_at")
      .eq("form_id", formId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!formResponse.data) {
    notFound();
  }

  if (fieldsResponse.error) throw new Error(fieldsResponse.error.message);
  if (registrationsResponse.error)
    throw new Error(registrationsResponse.error.message);

  return {
    form: formResponse.data as FormConfig,
    fields: (fieldsResponse.data ?? []) as RegistrationField[],
    registrations: (registrationsResponse.data ?? []) as RegistrationRecord[],
    capacity: settingsResponse.data?.lab_capacity ?? 50,
    maxParticipants: settingsResponse.data?.max_participants ?? 200,
    registrationsCloseAt: settingsResponse.data?.registrations_close_at ?? null,
    email: email ?? "admin",
  };
}

export default async function FormDashboardPage({ params }: Props) {
  const { formId } = await params;
  const data = await getFormDashboardData(formId);

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
              <Button
                href="/admin/dashboard"
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  textTransform: "none",
                  mb: 1,
                  pl: 0,
                  "&:hover": { color: "white", bgcolor: "transparent" },
                }}
              >
                Tutti i form
              </Button>
              <Typography variant="h4" sx={{ color: "white", mb: 0.5 }}>
                {data.form.title}
              </Typography>
              {data.form.description && (
                <Typography sx={{ color: "rgba(255,255,255,0.8)", mb: 0.5 }}>
                  {data.form.description}
                </Typography>
              )}
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                Sessione: {data.email} · /forms/{data.form.slug}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
              <Button
                href={`/api/export/csv?form_id=${formId}`}
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
                href={`/api/export/xlsx?form_id=${formId}`}
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
                href={`/forms/${data.form.slug}`}
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
          formId={formId}
          form={data.form}
          fields={data.fields}
          registrations={data.registrations}
          capacity={data.capacity}
          maxParticipants={data.maxParticipants}
          registrationsCloseAt={data.registrationsCloseAt}
        />
      </Box>
    </AdminDashboardClient>
  );
}
