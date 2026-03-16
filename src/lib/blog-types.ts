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
