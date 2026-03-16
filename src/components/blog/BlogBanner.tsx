import { BookOpen, TrendingUp, Users, Clock } from "lucide-react";

interface BlogBannerProps {
  postCount: number;
}

export default function BlogBanner({ postCount }: BlogBannerProps) {
  const stats = [
    { icon: BookOpen, value: `${postCount}+`, label: "Articles" },
    { icon: TrendingUp, value: "8+", label: "Topics" },
    { icon: Users, value: "5+", label: "Authors" },
    { icon: Clock, value: "4 min", label: "Avg read" },
  ];

  return (
    <div className="border-y border-border/30 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
