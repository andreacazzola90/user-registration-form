import type {
  RegistrationField,
  RegistrationRecord,
  SummaryCardConfig,
} from "@/lib/types";
import { RESERVED_STANDARD_KEYS } from "@/lib/registration-columns";
import { parseStoredTicketSelection } from "@/lib/tickets";

export type SummaryMetricOption = {
  source: "standard" | "field" | "tickets";
  key: string;
  label: string;
};

// Lab metrics only make sense for the lab-capacity form ("passeggiata-monte-di-malo").
const STANDARD_NUMERIC_FIELDS: Array<
  SummaryMetricOption & { labOnly?: boolean }
> = [
  { source: "standard", key: "children_under_3", label: "Bimbi <3", labOnly: true },
  {
    source: "standard",
    key: "children_over_3_labs",
    label: "Bimbi >3",
    labOnly: true,
  },
  { source: "standard", key: "adults", label: "Adulti", labOnly: true },
];

type SummaryOptions = {
  includeLabColumns?: boolean;
};

/** Fields/columns an admin can pick to build a custom summary card. */
export function getAvailableSummaryMetricOptions(
  fields: RegistrationField[],
  options?: SummaryOptions,
): SummaryMetricOption[] {
  const includeLabColumns = options?.includeLabColumns ?? false;

  const standardOptions = STANDARD_NUMERIC_FIELDS.filter(
    (option) => !option.labOnly || includeLabColumns,
  ).map(({ source, key, label }) => ({ source, key, label }));

  const fieldOptions: SummaryMetricOption[] = fields
    .filter((field) => field.active)
    .map((field) =>
      field.field_type === "tickets"
        ? {
            source: "tickets",
            key: field.key,
            label: `${field.label} (partecipanti)`,
          }
        : { source: "field", key: field.key, label: field.label },
    );

  return [...standardOptions, ...fieldOptions];
}

function rawValueFor(
  registration: RegistrationRecord,
  config: SummaryCardConfig,
): unknown {
  if (!config.key) return undefined;

  // A "field" reusing a reserved key (e.g. a custom "adults" question) still has its value
  // written to the dedicated registrations column, never to additional_data — same rule as
  // getColumnValue in lib/registration-columns.ts.
  if (config.source === "standard" || RESERVED_STANDARD_KEYS.includes(config.key)) {
    return (registration as unknown as Record<string, unknown>)[config.key];
  }

  return registration.additional_data?.[config.key];
}

/** Computes a configured summary card's value across the given registrations. */
export function computeSummaryCardValue(
  config: SummaryCardConfig,
  registrations: RegistrationRecord[],
): number {
  if (config.source === "total") {
    return registrations.length;
  }

  if (config.source === "tickets") {
    return registrations.reduce((sum, registration) => {
      const selection = parseStoredTicketSelection(
        registration.additional_data?.[config.key ?? ""],
      );
      return (
        sum +
        (selection?.items.reduce((itemSum, item) => itemSum + item.quantity, 0) ??
          0)
      );
    }, 0);
  }

  if (config.metric === "sum") {
    return registrations.reduce((acc, registration) => {
      const value = Number(rawValueFor(registration, config));
      return acc + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  return registrations.filter((registration) => {
    const value = rawValueFor(registration, config);
    return value !== undefined && value !== null && value !== "";
  }).length;
}
