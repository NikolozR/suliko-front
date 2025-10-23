import { BlogData } from '../types/types.Blog';

// Fallback blog data in case JSON import fails
const fallbackBlogData: BlogData = {
  posts: [
    {
      id: "welcome-to-suliko-blog",
      title: {
        en: "Welcome to the Suliko Blog",
        ka: "მოგესალმებით Suliko-ს ბლოგში",
        pl: "Witamy w blogu Suliko"
      },
      excerpt: {
        en: "Discover the latest insights, updates, and innovations in AI-powered translation technology.",
        ka: "გაეცანით უახლეს ტრენდებს, განახლებებს და ინოვაციებს AI-ზე დაფუძნებულ თარგმანის ტექნოლოგიაში.",
        pl: "Odkryj najnowsze trendy, aktualizacje i innowacje w technologii tłumaczeń opartej na AI."
      },
      content: {
        en: "# Welcome to the Suliko Blog\n\nWe're excited to share our journey in revolutionizing translation technology through artificial intelligence.\n\n## What You'll Find Here\n\n- **Technology Insights**: Deep dives into our AI translation algorithms\n- **Product Updates**: Latest features and improvements\n- **Industry News**: Trends and developments in translation technology\n- **User Stories**: How Suliko is helping people communicate across languages\n\n## Our Mission\n\nAt Suliko, we believe language should never be a barrier to communication. Our AI-powered translation platform makes it easier than ever to translate documents, chat conversations, and text across multiple languages.\n\nStay tuned for regular updates and insights from our team!",
        ka: "# მოგესალმებით Suliko-ს ბლოგში\n\nჩვენ ვართ მოხარულნი, რომ გავაზიაროთ ჩვენი მოგზაურობა თარგმანის ტექნოლოგიის რევოლუციონირებაში ხელოვნური ინტელექტის მეშვეობით.",
        pl: "# Witamy w blogu Suliko\n\nCieszymy się, że możemy podzielić się naszą podróżą w rewolucjonizowaniu technologii tłumaczeń poprzez sztuczną inteligencję."
      },
      author: {
        name: "Suliko Team",
        email: "team@suliko.com",
        avatar: "/team-avatar.png"
      },
      publishedAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      tags: ["announcement", "welcome", "technology"],
      category: "announcements",
      featuredImage: "/blog/Blog2.png",
      readTime: 3,
      published: true,
      featured: true
    }
  ],
  categories: [
    {
      id: "announcements",
      name: {
        en: "Announcements",
        ka: "განცხადებები",
        pl: "Ogłoszenia"
      },
      description: {
        en: "Important updates and announcements from the Suliko team",
        ka: "მნიშვნელოვანი განახლებები და განცხადებები Suliko-ს გუნდისგან",
        pl: "Ważne aktualizacje i ogłoszenia od zespołu Suliko"
      }
    }
  ],
  meta: {
    totalPosts: 1,
    lastUpdated: "2024-01-15T10:00:00Z"
  }
};

export async function loadBlogData(): Promise<BlogData> {
  try {
    // Try to import the JSON data dynamically
    const blogDataModule = await import('../../../data/blog.json');
    return blogDataModule.default as BlogData;
  } catch (error) {
    console.error('Failed to load blog data from JSON, using fallback:', error);
    return fallbackBlogData;
  }
}
