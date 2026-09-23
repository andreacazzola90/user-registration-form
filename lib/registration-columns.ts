import type {
  DisplayColumnSetting,
  RegistrationField,
  RegistrationRecord,
  TicketOption,
} from "@/lib/types";
import { formatTicketSelection, parseStoredTicketSelection } from "@/lib/tickets";

export type ResolvedColumn = {
  key: string;
  label: string;
  source: "standard" | "field";
  align: "left" | "center";
};

// children_under_3/children_over_3_labs/adults/status are specific to forms with the lab-capacity
// workflow ("passeggiata-monte-di-malo"): status only ever becomes "waitlist" there, so for every
// other form (e.g. "andar par veci maronari 2026") it's always "Confermato" and carries no signal.
const STANDARD_COLUMNS: Array<
  Omit<ResolvedColumn, "source"> & { labOnly?: boolean }
> = [
  { key: "created_at", label: "Data", align: "left" },
  { key: "first_name", label: "Nome", align: "left" },
  { key: "last_name", label: "Cognome", align: "left" },
  { key: "phone", label: "Telefono", align: "left" },
  { key: "email", label: "Email", align: "left" },
  { key: "children_under_3", label: "Bimbi <3", align: "center", labOnly: true },
  {
    key: "children_over_3_labs",
    label: "Bimbi >3",
    align: "center",
    labOnly: true,
  },
  { key: "adults", label: "Adulti", align: "center", labOnly: true },
  { key: "status", label: "Stato", align: "center", labOnly: true },
];

// "country" has no unconditional fallback column: it's only shown when the form still has an
// active module field asking for it (its value always lives in registrations.country, never in
// additional_data, and getColumnValue below reads it directly regardless of the field's label/key
// binding, so it's covered even though it isn't part of STANDARD_COLUMNS).
const DB_BACKED_KEYS = new Set([
  ...STANDARD_COLUMNS.map((column) => column.key),
  "country",
]);

/** Keys reserved by the built-in registration columns; custom form fields must not reuse them. */
export const RESERVED_STANDARD_KEYS = Array.from(DB_BACKED_KEYS);

type ColumnOptions = {
  includeLabColumns?: boolean;
};

/** Full set of columns available for a form: fixed registration columns plus its custom fields. */
export function getAvailableColumns(
  fields: RegistrationField[],
  options?: ColumnOptions,
): ResolvedColumn[] {
  const includeLabColumns = options?.includeLabColumns ?? false;
  const activeFieldKeys = new Set(
    fields.filter((field) => field.active).map((field) => field.key),
  );

  // A module field reusing a reserved key (legacy data) supersedes the standard
  // column so only the module's own value is shown, instead of duplicating "Cognome".
  const standardColumns: ResolvedColumn[] = STANDARD_COLUMNS.filter(
    (column) => (!column.labOnly || includeLabColumns) && !activeFieldKeys.has(column.key),
  ).map(({ key, label, align }) => ({ key, label, align, source: "standard" }));

  const fieldColumns: ResolvedColumn[] = fields
    .filter((field) => field.active)
    .map((field) => ({
      key: field.key,
      label: field.label,
      source: "field",
      align: field.field_type === "number" ? "center" : "left",
    }));

  return [...standardColumns, ...fieldColumns];
}

/** Resolves the ordered, visible columns for a form given its saved display settings. */
export function resolveDisplayColumns(
  fields: RegistrationField[],
  settings: DisplayColumnSetting[] | null | undefined,
  options?: ColumnOptions,
): ResolvedColumn[] {
  const available = getAvailableColumns(fields, options);

  if (!settings || settings.length === 0) {
    return available;
  }

  const availableByKey = new Map(
    available.map((column) => [`${column.source}:${column.key}`, column]),
  );

  const ordered = settings
    .filter((setting) => setting.visible)
    .map((setting) => availableByKey.get(`${setting.source}:${setting.key}`))
    .filter((column): column is ResolvedColumn => Boolean(column));

  // A column absent from saved settings hasn't been configured yet (e.g. a newly
  // added field); anything explicitly saved as hidden must stay hidden.
  const configured = new Set(
    settings.map((setting) => `${setting.source}:${setting.key}`),
  );
  const missing = available.filter(
    (column) => !configured.has(`${column.source}:${column.key}`),
  );

  return [...ordered, ...missing];
}

export type EditableColumn = ResolvedColumn & { visible: boolean };

/** Full list of available columns (visible and hidden) in their configured order, for editing UI. */
export function resolveColumnSettingsForEditing(
  fields: RegistrationField[],
  settings: DisplayColumnSetting[] | null | undefined,
  options?: ColumnOptions,
): EditableColumn[] {
  const available = getAvailableColumns(fields, options);
  const availableByKey = new Map(
    available.map((column) => [`${column.source}:${column.key}`, column]),
  );

  const ordered: EditableColumn[] = (settings ?? [])
    .map((setting) => {
      const column = availableByKey.get(`${setting.source}:${setting.key}`);
      return column ? { ...column, visible: setting.visible } : undefined;
    })
    .filter((column): column is EditableColumn => Boolean(column));

  const seen = new Set(ordered.map((column) => `${column.source}:${column.key}`));
  const missing = available
    .filter((column) => !seen.has(`${column.source}:${column.key}`))
    .map((column) => ({ ...column, visible: true }));

  return [...ordered, ...missing];
}

function isTicketOption(value: unknown): value is TicketOption {
  return typeof value === "object" && value !== null && "title" in value;
}

function formatFieldValue(
  field: RegistrationField | undefined,
  rawValue: string | number | undefined,
): string {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return "";
  }

  if (field?.field_type === "tickets") {
    return formatTicketSelection(rawValue);
  }

  return String(rawValue);
}

export type TicketRow = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
};

/** Structured, per-ticket rows (with thumbnail) for rendering a "tickets" field column as a mini table. */
export function getTicketRows(
  registration: RegistrationRecord,
  column: ResolvedColumn,
  fields: RegistrationField[],
): TicketRow[] | null {
  const field = fields.find((item) => item.key === column.key);
  if (field?.field_type !== "tickets") {
    return null;
  }

  const selection = parseStoredTicketSelection(
    registration.additional_data?.[column.key],
  );
  if (!selection || selection.items.length === 0) {
    return null;
  }

  const optionsById = new Map(
    field.options.filter(isTicketOption).map((option) => [option.id, option]),
  );

  return selection.items.map((item) => ({
    id: item.id,
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
    imageUrl: optionsById.get(item.id)?.imageUrl ?? "",
  }));
}

/** Returns the display value of a registration for a given resolved column. */
export function getColumnValue(
  registration: RegistrationRecord,
  column: ResolvedColumn,
  fields: RegistrationField[],
): string {
  // Reserved keys always live on the dedicated registrations column (api/register/route.ts
  // strips them out of additional_data), regardless of whether the column is tagged "standard"
  // or "field" (a module field reusing the key, e.g. a form's own "Cognome" question).
  if (DB_BACKED_KEYS.has(column.key)) {
    switch (column.key) {
      case "created_at":
        return new Date(registration.created_at).toLocaleString("it-IT");
      case "status":
        return registration.status === "confirmed" ? "Confermato" : "Attesa";
      default:
        return String(
          (registration as unknown as Record<string, unknown>)[column.key] ??
            "",
        );
    }
  }

  const field = fields.find((item) => item.key === column.key);
  return formatFieldValue(field, registration.additional_data?.[column.key]);
}
