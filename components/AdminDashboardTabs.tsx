"use client";

import { useMemo, useState } from "react";
import { AdminFieldManager } from "@/components/AdminFieldManager";
import { AdminRegistrationsTable } from "@/components/AdminRegistrationsTable";
import { AdminRulesManager } from "@/components/AdminRulesManager";
import type { RegistrationField, RegistrationRecord } from "@/lib/types";

type Props = {
  fields: RegistrationField[];
  registrations: RegistrationRecord[];
  capacity: number;
};

type TabKey = "participants" | "fields" | "rules";

export function AdminDashboardTabs({ fields, registrations, capacity }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("participants");

  const tabs = useMemo(
    () => [
      { key: "participants" as const, label: "Partecipanti" },
      { key: "fields" as const, label: "Campi" },
      { key: "rules" as const, label: "Regole" },
    ],
    [],
  );

  return (
    <section className="card" style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--line)",
          paddingBottom: "0.8rem",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              className="btn"
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: isActive ? "var(--accent)" : "#fff",
                color: isActive ? "#fff" : "var(--ink)",
                border: isActive
                  ? "1px solid var(--accent)"
                  : "1px solid var(--line)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "participants" && (
        <AdminRegistrationsTable
          registrations={registrations}
          capacity={capacity}
        />
      )}

      {activeTab === "fields" && <AdminFieldManager initialFields={fields} />}

      {activeTab === "rules" && (
        <AdminRulesManager
          initialLabCapacity={capacity}
          confirmedLabChildren={registrations
            .filter((registration) => registration.status === "confirmed")
            .reduce(
              (acc, registration) => acc + registration.children_over_3_labs,
              0,
            )}
        />
      )}
    </section>
  );
}
