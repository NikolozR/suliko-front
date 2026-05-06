import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/blog/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('*, blog_post_translations(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/blog/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { cover_image, author_name, tags, status, published_at, translations } = body;

  const { error: postError } = await supabaseAdmin
    .from('blog_posts')
    .update({ cover_image, author_name, tags, status, published_at, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });

  if (translations && Array.isArray(translations)) {
    for (const t of translations as { locale: string; slug: string; title: string; excerpt: string; content: string }[]) {
      await supabaseAdmin
        .from('blog_post_translations')
        .upsert(
          { post_id: id, locale: t.locale, slug: t.slug, title: t.title, excerpt: t.excerpt, content: t.content },
          { onConflict: 'post_id,locale' }
        );
    }
  }

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('*, blog_post_translations(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/blog/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { error } = await supabaseAdmin.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
