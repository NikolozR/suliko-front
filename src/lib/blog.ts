import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { format } from 'date-fns';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  tags?: string[];
  content: string;
  readingTime: string;
}

const contentDirectory = path.join(process.cwd(), 'content/blog');

export function getAllPosts(): BlogPost[] {
  try {
    // Check if content directory exists
    if (!fs.existsSync(contentDirectory)) {
      console.error('Content directory does not exist:', contentDirectory);
      return [];
    }

    const fileNames = fs.readdirSync(contentDirectory);
    const allPostsData = fileNames
      .filter((name) => name.endsWith('.mdx'))
      .map((fileName) => {
        try {
          const slug = fileName.replace(/\.mdx$/, '');
          const fullPath = path.join(contentDirectory, fileName);
          
          // Check if file exists
          if (!fs.existsSync(fullPath)) {
            console.error('File does not exist:', fullPath);
            return null;
          }
          
          const fileContents = fs.readFileSync(fullPath, 'utf8');
          const { data, content } = matter(fileContents);
          
          const stats = readingTime(content);
          
          return {
            slug,
            title: data.title || 'Untitled',
            date: data.date || new Date().toISOString(),
            excerpt: data.excerpt || '',
            coverImage: data.coverImage,
            author: data.author || 'Unknown Author',
            tags: data.tags || [],
            content,
            readingTime: stats.text,
          };
        } catch (fileError) {
          console.error(`Error processing file ${fileName}:`, fileError);
          return null;
        }
      })
      .filter((post): post is BlogPost => post !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allPostsData;
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`Post file does not exist: ${fullPath}`);
      return null;
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    const stats = readingTime(content);
    
    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || new Date().toISOString(),
      excerpt: data.excerpt || '',
      coverImage: data.coverImage,
      author: data.author || 'Unknown Author',
      tags: data.tags || [],
      content,
      readingTime: stats.text,
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

export function getAllPostSlugs(): string[] {
  try {
    // Check if content directory exists
    if (!fs.existsSync(contentDirectory)) {
      console.error('Content directory does not exist:', contentDirectory);
      return [];
    }
    
    const fileNames = fs.readdirSync(contentDirectory);
    return fileNames
      .filter((name) => name.endsWith('.mdx'))
      .map((fileName) => fileName.replace(/\.mdx$/, ''));
  } catch (error) {
    console.error('Error reading post slugs:', error);
    return [];
  }
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMMM dd, yyyy');
}
