import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";

const BUCKET_NAME = "user-registration-form";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function requireUser() {
  const email = await getAdminEmail();
  return { email };
}

export async function POST(request: Request) {
  const { email } = await requireUser();

  if (!email) {
    return unauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Nessun file fornito" },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Il file deve essere un'immagine" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "L'immagine è troppo grande (max 5MB)" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;

    // Use admin client to bypass RLS for storage uploads
    const adminSupabase = createSupabaseAdminClient();

    const { data, error } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(`slides/${fileName}`, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { message: `Errore upload: ${error.message}` },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = adminSupabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`slides/${fileName}`);

    return NextResponse.json(
      { imageUrl: publicUrl, fileName: data.path },
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload exception:", error);
    return NextResponse.json(
      { message: "Errore durante l'upload" },
      { status: 500 },
    );
  }
}
