import { Mail, Send } from 'lucide-react';
import { Button } from '@/features/ui';

export default function NewsletterSection() {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-border/50 shadow-sm">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-primary mb-4">
          <Mail className="w-4 h-4" />
          <span className="text-sm font-medium">Newsletter</span>
        </div>
        
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Stay Updated
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          Get the latest insights and updates delivered to your inbox.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <Button size="sm" className="px-4 py-2">
            <Send className="w-4 h-4 mr-1" />
            Subscribe
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3">
          No spam, unsubscribe at any time.
        </p>
      </div>
    </div>
  );
}
