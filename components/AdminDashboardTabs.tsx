"use client";

import { useMemo, useState } from "react";
import { AdminFieldManager } from "@/components/AdminFieldManager";
import { AdminFormContentManager } from "@/components/AdminFormContentManager";
import AdminSliderManager from "@/components/AdminSliderManager";
import { AdminRegistrationsTable } from "@/components/AdminRegistrationsTable";
import { AdminRulesManager } from "@/components/AdminRulesManager";
import { AdminLabCapacityManager } from "@/components/AdminLabCapacityManager";
import { AdminCustomCssManager } from "@/components/AdminCustomCssManager";
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
  maxParticipants: number;
  registrationsCloseAt: string | null;
  supportsLabCapacity: boolean;
  labCapacityEnabled: boolean;
};

type TabKey =
  | "participants"
  | "fields"
  | "contents"
  | "slides"
  | "css"
  | "rules"
  | "labs";

type DashboardTab = {
  key: TabKey;
  label: string;
  meta: string;
};

export function AdminDashboardTabs({
  formId,
  form,
  fields,
  registrations,
  capacity,
  maxParticipants,
  registrationsCloseAt,
  supportsLabCapacity,
  labCapacityEnabled,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("participants");
  const [isLabCapacityEnabled, setIsLabCapacityEnabled] = useState(
    labCapacityEnabled,
  );
  const [customCss, setCustomCss] = useState(form.custom_css ?? "");
  const [customCssEnabled, setCustomCssEnabled] = useState(
    form.custom_css_enabled ?? false,
  );
  const waitlistCount = registrations.filter(
    (registration) => registration.status === "waitlist",
  ).length;

  const tabs = useMemo(() => {
    const items: DashboardTab[] = [
      {
        key: "participants",
        label: "Partecipanti",
        meta: `${registrations.length}`,
      },
      { key: "fields", label: "Campi", meta: `${fields.length}` },
      {
        key: "contents",
        label: "Contenuti",
        meta: "testi",
      },
      {
        key: "slides",
        label: "Slide",
        meta: `${form.slider_data?.length || 0}`,
      },
      {
        key: "css",
        label: "Style",
        meta: customCssEnabled ? "attivo" : "off",
      },
      {
        key: "rules",
        label: "Regole",
        meta:
          isLabCapacityEnabled && waitlistCount > 0
            ? `${waitlistCount} attesa`
            : "ok",
      },
    ];

    if (supportsLabCapacity) {
      items.push({
        key: "labs",
        label: "Laboratori",
        meta: isLabCapacityEnabled ? `${capacity}` : "off",
      });
    }

    return items;
  },
    [
      capacity,
      fields.length,
      isLabCapacityEnabled,
      registrations.length,
      waitlistCount,
      form.slider_data?.length,
      customCss,
      customCssEnabled,
      supportsLabCapacity,
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
            label={
              isLabCapacityEnabled
                ? `Capienza laboratori: ${capacity}`
                : `Limite iscrizioni: ${maxParticipants}`
            }
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
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, md: 2 },
            "& .MuiTabs-scrollButtons": {
              color: "#0f8a84",
            },
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
              minWidth: "max-content",
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
            showLabMetrics={isLabCapacityEnabled}
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

        {activeTab === "css" && (
          <AdminCustomCssManager
            formId={formId}
            initialCss={customCss}
            initialEnabled={customCssEnabled}
            onSaved={(nextCss, enabled) => {
              setCustomCss(nextCss);
              setCustomCssEnabled(enabled);
            }}
          />
        )}

        {activeTab === "rules" && (
          <AdminRulesManager
            formId={formId}
            initialMaxParticipants={maxParticipants}
            initialRegistrationsCloseAt={registrationsCloseAt}
            totalRegistrations={registrations.length}
          />
        )}

        {activeTab === "labs" && supportsLabCapacity && (
          <AdminLabCapacityManager
            formId={formId}
            initialCapacity={capacity}
            initialEnabled={isLabCapacityEnabled}
            onEnabledChange={setIsLabCapacityEnabled}
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
