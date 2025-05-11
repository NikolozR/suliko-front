import { FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const RecentDocumentsCard: FC = () => (
  <Card className="mt-12 border-none">
    <CardHeader>
      <CardTitle className="text-foreground">Recent Documents</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Your recently uploaded documents will appear here
      </p>
    </CardContent>
  </Card>
);

export default RecentDocumentsCard; 