"use client";

import { useMemo, useState } from "react";
import { AdminFieldManager } from "@/components/AdminFieldManager";
import { AdminFormContentManager } from "@/components/AdminFormContentManager";
import AdminSliderManager from "@/components/AdminSliderManager";
import { AdminRegistrationsTable } from "@/components/AdminRegistrationsTable";
import { AdminRulesManager } from "@/components/AdminRulesManager";
import type {
  FormConfig,
  RegistrationField,
  RegistrationRecord,
} from "@/lib/types";
import { Box, Tabs, Tab, Paper, Stack, Typography, Chip } from "@mui/material";

type Props = {
  formId: string;
  form: FormConfig;
  fields: RegistrationField[];
  registrations: RegistrationRecord[];
  capacity: number;
};

type TabKey = "participants" | "fields" | "contents" | "slides" | "rules";

export function AdminDashboardTabs({
  formId,
  form,
  fields,
  registrations,
  capacity,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("participants");
  const waitlistCount = registrations.filter(
    (registration) => registration.status === "waitlist",
  ).length;

  const tabs = useMemo(
    () => [
      {
        key: "participants" as const,
        label: "Partecipanti",
        meta: `${registrations.length}`,
      },
      { key: "fields" as const, label: "Campi", meta: `${fields.length}` },
      {
        key: "contents" as const,
        label: "Contenuti",
        meta: "testi",
      },
      {
        key: "slides" as const,
        label: "Slide",
        meta: `${form.slider_data?.length || 0}`,
      },
      {
        key: "rules" as const,
        label: "Regole",
        meta: waitlistCount > 0 ? `${waitlistCount} attesa` : "ok",
      },
    ],
    [
      fields.length,
      registrations.length,
      waitlistCount,
      form.slider_data?.length,
    ],
  );

  return (
    <Paper elevation={0} sx={{ border: "1px solid #d9dfe7", borderRadius: 2 }}>
      <Box sx={{ borderBottom: "1px solid #dde3ea", bgcolor: "#f8fafc" }}>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, md: 3 },
            py: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#485560",
            }}
          >
            Pannello gestione
          </Typography>
          <Chip
            label={`Capienza: ${capacity}`}
            variant="outlined"
            size="small"
            sx={{
              borderColor: "#0f8a84",
              color: "#0f8a84",
              fontWeight: 600,
            }}
          />
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue as TabKey)}
          sx={{
            px: { xs: 1, md: 2 },
            "& .MuiTabs-indicator": {
              backgroundColor: "#0f8a84",
              height: 3,
            },
            "& .MuiTab-root": {
              textTransform: "none",
              color: "#485560",
              fontSize: 15,
              fontWeight: 500,
              py: 1.5,
              px: 2,
              minHeight: "auto",
              "&.Mui-selected": {
                color: "#0f8a84",
                fontWeight: 600,
              },
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              value={tab.key}
              label={
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <span>{tab.label}</span>
                  <Box
                    sx={{
                      backgroundColor:
                        activeTab === tab.key ? "#0f8a84" : "#d1d7df",
                      color: "white",
                      borderRadius: "12px",
                      px: 1,
                      py: 0.25,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {tab.meta}
                  </Box>
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {activeTab === "participants" && (
          <AdminRegistrationsTable
            registrations={registrations}
            capacity={capacity}
          />
        )}

        {activeTab === "fields" && (
          <AdminFieldManager formId={formId} initialFields={fields} />
        )}

        {activeTab === "contents" && <AdminFormContentManager form={form} />}

        {activeTab === "slides" && (
          <AdminSliderManager
            formId={formId}
            form={form}
            onUpdate={(updatedForm) => {
              // UI automatically updated through state
              console.log("Slides updated:", updatedForm);
            }}
          />
        )}

        {activeTab === "rules" && (
          <AdminRulesManager
            formId={formId}
            initialLabCapacity={capacity}
            confirmedLabChildren={registrations
              .filter((registration) => registration.status === "confirmed")
              .reduce(
                (acc, registration) => acc + registration.children_over_3_labs,
                0,
              )}
          />
        )}
      </Box>
    </Paper>
  );
}
