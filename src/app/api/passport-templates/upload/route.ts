import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import JSZip from "jszip";

function extractPlaceholders(xmlContent: string): string[] {
  const textOnly = xmlContent.replace(/<[^>]+>/g, "");
  const matches = textOnly.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];

  const keys = matches.map((m) => m.replace(/^\{\{|\}\}$/g, "").trim());
  return [...new Set(keys)];
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "docx") {
      return NextResponse.json(
        { error: "Only .docx files are supported" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.docx`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("passport-templates")
      .upload(fileName, buffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });

    if (uploadError) {
      console.error("[passport-templates/upload] Supabase upload error:", JSON.stringify(uploadError));
      return NextResponse.json(
        { error: `Storage error: ${uploadError.message} (status: ${(uploadError as { statusCode?: string }).statusCode ?? 'unknown'})` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("passport-templates")
      .getPublicUrl(fileName);

    let placeholders: string[] = [];
    try {
      const zip = await JSZip.loadAsync(buffer);
      const docXml = await zip.file("word/document.xml")?.async("string");
      if (docXml) {
        placeholders = extractPlaceholders(docXml);
      }

      const headerFiles = Object.keys(zip.files).filter(
        (f) => f.startsWith("word/header") && f.endsWith(".xml")
      );
      const footerFiles = Object.keys(zip.files).filter(
        (f) => f.startsWith("word/footer") && f.endsWith(".xml")
      );

      for (const hf of [...headerFiles, ...footerFiles]) {
        const xml = await zip.file(hf)?.async("string");
        if (xml) {
          const extra = extractPlaceholders(xml);
          for (const key of extra) {
            if (!placeholders.includes(key)) {
              placeholders.push(key);
            }
          }
        }
      }
    } catch (zipErr) {
      console.error("[passport-templates/upload] JSZip parse error:", zipErr);
      // If parsing fails, return the URL with empty placeholders
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      placeholders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[passport-templates/upload] Unhandled error:", message);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
