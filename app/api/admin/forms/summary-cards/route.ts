import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";
import { recordSecurityEvent } from "@/lib/security";

const cardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  metric: z.enum(["sum", "count"]),
  source: z.enum(["total", "standard", "field"]),
  key: z.string().nullable(),
});

const updateSchema = z.object({
  form_id: z.string().uuid(),
  cards: z.array(cardSchema),
});

export async function PUT(request: Request) {
  const email = await getAdminEmail();
  if (!email) return unauthorizedResponse();

  const supabase = createSupabaseAdminClient();

  try {
    const body = updateSchema.parse(await request.json());

    const { error } = await supabase
      .from("forms")
      .update({ summary_cards: body.cards })
      .eq("id", body.form_id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    await recordSecurityEvent(request, "admin_summary_cards_updated", email, {
      formId: body.form_id,
    });

    return NextResponse.json({ message: "Indicatori aggiornati" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? "Payload non valido" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Payload non valido" },
      { status: 400 },
    );
  }
}
