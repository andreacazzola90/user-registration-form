import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdminEmail, unauthorizedResponse } from "@/lib/admin-session";
import { consumeRateLimit, recordSecurityEvent } from "@/lib/security";

const BUCKET_NAME = "user-registration-form";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

function detectImageType(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

async function requireUser() {
  const email = await getAdminEmail();
  return { email };
}

export async function POST(request: Request) {
  const { email } = await requireUser();

  if (!email) {
    return unauthorizedResponse();
  }

  if (!(await consumeRateLimit(request, "admin-upload", email, 30, 60 * 60))) {
    return NextResponse.json(
      { message: "Troppi caricamenti. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_FILE_SIZE + 64 * 1024) {
    return NextResponse.json(
      { message: "L'immagine è troppo grande (max 5MB)" },
      { status: 413 },
    );
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

    if (!(file.type in ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json(
        { message: "Sono consentite solo immagini JPEG, PNG o WebP" },
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
    const detectedType = detectImageType(buffer);
    if (!detectedType || detectedType !== file.type) {
      return NextResponse.json(
        { message: "Il contenuto del file non corrisponde a un'immagine valida" },
        { status: 400 },
      );
    }

    const extension = ALLOWED_IMAGE_TYPES[detectedType];
    const fileName = `${randomUUID()}.${extension}`;

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

    await recordSecurityEvent(request, "admin_image_uploaded", email, {
      path: data.path,
      contentType: detectedType,
      size: file.size,
    });

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
