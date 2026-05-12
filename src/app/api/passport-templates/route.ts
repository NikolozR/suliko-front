import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";

  let query = supabaseAdmin
    .from("passport_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, country, docx_file_url, fields } = body;

  if (!name || !country || !docx_file_url) {
    return NextResponse.json(
      { error: "name, country, and docx_file_url are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("passport_templates")
    .insert({
      name,
      country,
      docx_file_url,
      fields: fields || [],
      is_active: true,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
