import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { AdminFormsManager } from "@/components/AdminFormsManager";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail } from "@/lib/admin-session";
import type { FormConfig } from "@/lib/types";
import { Box, Chip, Stack, Typography } from "@mui/material";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const email = await getAdminEmail();

  if (!email) {
    redirect("/admin/login");
  }

  const supabase = createSupabaseAdminClient();
  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .order("created_at", { ascending: false });

  return {
    forms: (forms ?? []) as FormConfig[],
    email,
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
          <Stack spacing={1.5}>
            <Chip
              label="Control Room"
              sx={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "white",
                fontWeight: 600,
                width: "fit-content",
              }}
            />
            <Typography variant="h4" sx={{ color: "white", mb: 0.5 }}>
              Dashboard Admin
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.85)" }}>
              Sessione: {data.email}
            </Typography>
          </Stack>
        </Box>

        <AdminFormsManager initialForms={data.forms} />
      </Box>
    </AdminDashboardClient>
  );
}
