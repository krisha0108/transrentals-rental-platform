import { TrailerHero } from '@/components/services/trailer/TrailerHero';
import { TrailerTypes } from '@/components/services/trailer/TrailerTypes';
import { TrailerBookingProcess } from '@/components/services/trailer/TrailerBookingProcess';
import { TrailerLocations } from '@/components/services/trailer/TrailerLocations';
import { TrailerFAQ } from '@/components/services/trailer/TrailerFAQ';

import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
import { HowToSchema } from '@/components/seo/schemas';
export const metadata = {
  title: 'Trailer on Rent - Heavy Duty Trailer Rental Services',
  description: 'Rent trailers for heavy cargo transportation. 20ft, 28ft, 32ft, 40ft trailers available. Book now for best rates across India.',
};

export default function TrailerRentalPage() {
  return (
    <>
      <HowToSchema
        name="How to Rent a Trailer on TransRentals"
        description="Book a heavy-duty trailer for cargo transport in 4 simple steps."
        totalTime="PT10M"
        steps={[
          { name: 'Enter Cargo & Route Details', text: 'Specify cargo type, weight, dimensions, pickup, and delivery location. Choose 20ft, 28ft, 32ft, or 40ft trailer.' },
          { name: 'Select Trailer Type', text: 'Choose flatbed trailer for machinery, container trailer for goods, or lowbed for oversized equipment.' },
          { name: 'Get Freight Quotes', text: 'Receive quotes from verified transporters. Check per-km rate, loading/unloading charges, and escort requirements.' },
          { name: 'Confirm & Track', text: 'Pay advance to confirm shipment. Driver picks up cargo on scheduled date. GPS tracking during transit.' },
        ]}
      />
      <ServiceHeroWithChat
        badge="Trailer Rental in 200+ Cities"
        title="Trailer on Rent | Heavy Equipment Transport"
        titleHighlight="Starting @₹7999/Day"
        description="Rent trailers for heavy equipment transport, machinery moving, and cargo hauling. Various sizes available."
        gradientFrom="stone-50"
        gradientTo="neutral-50"
      />

      <TrailerHero />
      <TrailerTypes />
      <TrailerBookingProcess />
      <TrailerLocations />
      <TrailerFAQ />
    </>
  );
}
