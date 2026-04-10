export type FieldType = "text" | "email" | "tel" | "number" | "select";

export type RegistrationField = {
  id: string;
  key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  active: boolean;
  sort_order: number;
  options: string[];
};

export type RegistrationStatus = "confirmed" | "waitlist";

export type RegistrationRecord = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  country: string;
  children_under_3: number;
  children_over_3_labs: number;
  adults: number;
  additional_data: Record<string, string | number>;
  status: RegistrationStatus;
  created_at: string;
};

export type SummaryStats = {
  totalRegistrations: number;
  totalChildrenUnder3: number;
  totalChildrenOver3Labs: number;
  totalAdults: number;
  confirmedChildrenOver3Labs: number;
  remainingSpots: number;
};
