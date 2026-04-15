import { DEFAULT_REGISTRATION_FIELDS } from "@/lib/default-fields";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistrationField } from "@/lib/types";

export async function getPublicRegistrationFields(): Promise<
  RegistrationField[]
> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("registration_fields")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return DEFAULT_REGISTRATION_FIELDS.map((field, index) => ({
        ...field,
        id: `default-${index}`,
      }));
    }

    return data as RegistrationField[];
  } catch {
    return DEFAULT_REGISTRATION_FIELDS.map((field, index) => ({
      ...field,
      id: `default-${index}`,
    }));
  }
}
