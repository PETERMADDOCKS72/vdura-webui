import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="mx-auto mt-8 max-w-md border-destructive">
      <CardContent className="p-6 text-center">
        <p className="mb-4 text-destructive">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
