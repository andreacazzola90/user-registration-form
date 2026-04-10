import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET() {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const png = await QRCode.toBuffer(baseUrl, {
    width: 900,
    margin: 1,
    color: {
      dark: "#1d312d",
      light: "#f7f3ea",
    },
  });

  return new NextResponse(png as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "inline; filename=iscrizione-qr.png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
