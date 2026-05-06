import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/blog — list all posts (admin, no status filter)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('*, blog_post_translations(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/blog — create a new post
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cover_image, author_name, tags, status, published_at, translations } = body;

  const { data: post, error: postError } = await supabaseAdmin
    .from('blog_posts')
    .insert({ cover_image, author_name, tags, status, published_at })
    .select()
    .single();

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });

  if (translations && Array.isArray(translations)) {
    const rows = translations.map(
      (t: { locale: string; slug: string; title: string; excerpt: string; content: string }) => ({
        post_id: post.id,
        locale: t.locale,
        slug: t.slug,
        title: t.title,
        excerpt: t.excerpt,
        content: t.content,
      })
    );

    const { error: transError } = await supabaseAdmin
      .from('blog_post_translations')
      .insert(rows);

    if (transError) return NextResponse.json({ error: transError.message }, { status: 500 });
  }

  return NextResponse.json(post, { status: 201 });
}
