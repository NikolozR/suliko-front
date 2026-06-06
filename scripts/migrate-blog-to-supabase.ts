/**
 * One-time migration: reads MDX files from /content/blog and inserts them
 * into Supabase as English posts.
 *
 * Run with:  npx tsx scripts/migrate-blog-to-supabase.ts
 *
 * Requires env vars (set in .env.local or export before running):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// Load .env.local manually (dotenv not required)
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
});

const contentDir = path.join(__dirname, '..', 'content', 'blog');

async function migrate() {
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.mdx'));
  console.log(`Found ${files.length} MDX file(s) to migrate.\n`);

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '');
    const raw = fs.readFileSync(path.join(contentDir, file), 'utf8');
    const { data, content } = matter(raw);

    console.log(`Migrating: ${file}`);

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        cover_image: data.coverImage ?? null,
        author_name: data.author ?? 'Suliko Team',
        tags: data.tags ?? [],
        status: 'published',
        published_at: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      })
      .select()
      .single();

    if (postError) {
      console.error(`  ✗ Failed to insert post: ${postError.message}`);
      continue;
    }

    const { error: transError } = await supabase
      .from('blog_post_translations')
      .insert({
        post_id: post.id,
        locale: 'en',
        slug,
        title: data.title ?? 'Untitled',
        excerpt: data.excerpt ?? '',
        content,
      });

    if (transError) {
      console.error(`  ✗ Failed to insert translation: ${transError.message}`);
    } else {
      console.log(`  ✓ Inserted as post ID ${post.id}`);
    }
  }

  console.log('\nMigration complete.');
}

migrate().catch(console.error);
