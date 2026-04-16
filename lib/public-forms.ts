import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormConfig } from "@/lib/types";

export async function getAllPublicForms(): Promise<FormConfig[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as FormConfig[];
  } catch {
    return [];
  }
}

export async function getPublicFormBySlug(
  slug: string,
): Promise<FormConfig | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;
    return data as FormConfig;
  } catch {
    return null;
  }
}
