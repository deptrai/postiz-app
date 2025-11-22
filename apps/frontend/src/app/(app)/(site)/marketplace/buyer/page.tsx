export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
import { Buyer } from '@gitroom/frontend/components/marketplace/buyer';
import { BuyerSeller } from '@gitroom/frontend/components/marketplace/buyer.seller';

export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz Marketplace - Buyer' : 'Gitroom Marketplace - Buyer'}`,
  description: '',
};

export default async function Page() {
  return (
    <div className="flex flex-col gap-[32px]">
      <BuyerSeller />
      <Buyer />
    </div>
  );
}
