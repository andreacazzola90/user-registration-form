import { Box, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { getPublicFormBySlug } from "@/lib/public-forms";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PrivacyPage({ params }: Props) {
  const { slug } = await params;
  const form = await getPublicFormBySlug(slug);

  if (!form) notFound();

  let privacyMarkdown = "";
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("event_settings")
      .select("privacy_markdown")
      .eq("form_id", form.id)
      .limit(1)
      .maybeSingle();
    privacyMarkdown = data?.privacy_markdown ?? "";
  } catch {
    privacyMarkdown = "";
  }

  return (
    <Box
      component="main"
      className="public-form-page public-privacy-page"
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f7f8",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, md: 8 },
      }}
    >
      <Box
        className="public-form-content-inner public-privacy-content"
        sx={{ maxWidth: 820, mx: "auto" }}
      >
        <NextLink
          href={`/forms/${form.slug}`}
          className="public-privacy-back-link"
          style={{
            display: "inline-block",
            marginBottom: 32,
            color: "#087c75",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Torna al modulo
        </NextLink>
        <Typography
          component="p"
          className="public-privacy-eyebrow"
          sx={{ color: "#0f8a84", fontSize: 13, fontWeight: 700, mb: 1 }}
        >
          Informativa privacy
        </Typography>
        <Typography
          component="h1"
          id="privacy-page-title"
          sx={{
            color: "#1f2f35",
            fontFamily: "var(--font-serif)",
            fontSize: { xs: 30, sm: 38 },
            fontWeight: 700,
            lineHeight: 1.2,
            mb: 4,
          }}
        >
          {form.title}
        </Typography>
        <Box
          component="article"
          className="public-privacy-article"
          sx={{
            color: "#35434d",
            fontSize: 16,
            lineHeight: 1.8,
            overflowWrap: "anywhere",
            "& h1, & h2, & h3": {
              color: "#1f2f35",
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              lineHeight: 1.3,
              mt: 3,
              mb: 1.5,
            },
            "& h1": { fontSize: 30 },
            "& h2": { fontSize: 24 },
            "& h3": { fontSize: 20 },
            "& p": { my: 0, mb: 2 },
            "& ul, & ol": { pl: 3, mb: 2 },
            "& li": { mb: 0.5, pl: 0.5 },
            "& a": { color: "#087c75", textUnderlineOffset: 3 },
            "& blockquote": {
              borderLeft: "3px solid #0f8a84",
              color: "#53636e",
              ml: 0,
              pl: 2,
            },
            "& code": {
              bgcolor: "#e8eef0",
              borderRadius: 1,
              fontFamily: "monospace",
              px: 0.5,
            },
            "& hr": { border: 0, borderTop: "1px solid #d9dfe7", my: 3 },
          }}
        >
          {privacyMarkdown.trim() ? (
            <ReactMarkdown>{privacyMarkdown}</ReactMarkdown>
          ) : (
            <Typography sx={{ color: "#62707c" }}>
              L&apos;informativa privacy non è ancora stata pubblicata.
            </Typography>
          )}
        </Box>
      </Box>
      {form.custom_css_enabled && form.custom_css && (
        <style data-form-custom-css>{form.custom_css}</style>
      )}
    </Box>
  );
}