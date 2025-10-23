import { BookOpen, TrendingUp, Users, Clock, Zap, Globe } from 'lucide-react';

interface BlogBannerProps {
  postCount: number;
}

export default function BlogBanner({ postCount }: BlogBannerProps) {
  return (
    <div className="blog-banner">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Articles Count */}
          <div className="text-center blog-banner-stat group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">{postCount}+</div>
            <div className="text-sm font-medium text-muted-foreground">Expert Articles</div>
            <div className="text-xs text-muted-foreground/70 mt-1">Fresh content weekly</div>
          </div>

          {/* Categories */}
          <div className="text-center blog-banner-stat group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">8+</div>
            <div className="text-sm font-medium text-muted-foreground">Topics Covered</div>
            <div className="text-xs text-muted-foreground/70 mt-1">AI, Translation, Tech</div>
          </div>

          {/* Authors */}
          <div className="text-center blog-banner-stat group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">5+</div>
            <div className="text-sm font-medium text-muted-foreground">Expert Authors</div>
            <div className="text-xs text-muted-foreground/70 mt-1">Industry professionals</div>
          </div>

          {/* Reading Time */}
          <div className="text-center blog-banner-stat group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-2">4min</div>
            <div className="text-sm font-medium text-muted-foreground">Average Read</div>
            <div className="text-xs text-muted-foreground/70 mt-1">Quick insights</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>New articles published every week</span>
            <Globe className="w-4 h-4 ml-2" />
            <span>Available in multiple languages</span>
          </div>
        </div>
      </div>
    </div>
  );
}
