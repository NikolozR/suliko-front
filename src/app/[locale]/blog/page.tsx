import { Suspense } from 'react';
import BlogPage from '@/features/blog/components/BlogPage';
import BlogSkeleton from '@/features/blog/components/BlogSkeleton';
import LandingHeader from '@/shared/components/LandingHeader';
import LandingFooter from '@/shared/components/LandingFooter';
import SulikoParticles from '@/shared/components/SulikoParticles';
import ScrollToTop from '@/shared/components/ScrollToTop';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog - Suliko',
  description: 'Discover insights, updates, and innovations in AI-powered translation technology.',
  openGraph: {
    title: 'Blog - Suliko',
    description: 'Discover insights, updates, and innovations in AI-powered translation technology.',
    type: 'website',
  },
};

export default function Blog() {
  return (
    <div className="min-h-screen relative">
      {/* Background particles */}
      <SulikoParticles
        className="fixed inset-0 z-0"
        fullScreen={true}
        particleCount={60}
        speed={0.5}
        enableInteractions={true}
      />
      
      {/* Main content */}
      <div className="relative z-10">
        <LandingHeader />
        <main className="pt-20">
          <Suspense fallback={<BlogSkeleton />}>
            <BlogPage />
          </Suspense>
        </main>
        <LandingFooter />
        <ScrollToTop />
      </div>
    </div>
  );
}
