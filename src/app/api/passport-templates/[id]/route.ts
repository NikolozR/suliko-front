import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("passport_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, country, docx_file_url, fields, is_active } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (country !== undefined) updates.country = country;
  if (docx_file_url !== undefined) updates.docx_file_url = docx_file_url;
  if (fields !== undefined) updates.fields = fields;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabaseAdmin
    .from("passport_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("passport_templates")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
