import { Metadata } from 'next';
import { AIChat } from '@gitroom/frontend/components/ai/ai-chat';

export const metadata: Metadata = {
  title: 'AI Analytics Assistant',
  description: 'Ask questions about your analytics data',
};

export default async function AIAnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">AI Analytics Assistant</h1>
          <p className="text-gray-400">
            Ask me anything about your analytics data and get insights powered by AI
          </p>
        </div>
        
        <div className="h-[600px]">
          <AIChat />
        </div>
      </div>
    </div>
  );
}
