import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, FileText, Wrench, Terminal, ArrowRight } from 'lucide-react';

const guides = [
  {
    icon: BookOpen,
    title: 'Terminology',
    description: "Familiarize yourself with our system's key terms and jargon. This glossary will help you better understand our documentation and resources.",
  },
  {
    icon: FileText,
    title: 'User Guide',
    description: 'Get step-by-step instructions on how to effectively use VDURA product. The user guide provides comprehensive details on functionalities, features, and tips for optimizing your experience.',
  },
  {
    icon: Wrench,
    title: 'Installation & Service Guide',
    description: 'Learn how to properly install and maintain our product with this detailed guide. It includes prerequisites, required tools, installation steps, and service maintenance protocols.',
  },
  {
    icon: Terminal,
    title: 'Command Line Interface Guide',
    description: 'For advanced users, this guide provides detailed instructions and commands for interacting with our product through the command line interface.',
  },
];

export default function Help() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Get Help</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {guides.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="transition-colors hover:border-vdura-amber/30">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <Icon className="h-6 w-6 text-muted-foreground" />
                <h2 className="text-lg font-bold">{title}</h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <div className="flex justify-end">
                <button className="flex items-center gap-2 text-sm font-medium text-vdura-amber hover:underline">
                  GO TO <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Any problems? Reach our support team at{' '}
        <span className="text-vdura-amber">MyVDURA</span>, send email to{' '}
        <span className="text-vdura-amber">support@vdura.com</span>{' '}
        or call to International Technical Support by any of our{' '}
        <span className="text-vdura-amber">toll-free numbers</span>.
      </p>
    </div>
  );
}
