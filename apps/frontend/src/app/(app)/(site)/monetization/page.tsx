import { Metadata } from 'next';
import { MonetizationDashboard } from '@gitroom/frontend/components/monetization/monetization-dashboard';

export const metadata: Metadata = {
  title: 'Monetization Dashboard',
  description: 'Track your progress towards Facebook monetization eligibility',
};

export default async function MonetizationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MonetizationDashboard />
    </div>
  );
}
