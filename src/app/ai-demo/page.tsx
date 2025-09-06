import { AIChatDemo } from '@/components/chat/AIChatDemo';

export default function AIDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <AIChatDemo />
    </div>
  );
}

export const metadata = {
  title: 'AI Chat Demo - Mobile Matrix',
  description: 'Demonstration of the improved AI chat responses',
};