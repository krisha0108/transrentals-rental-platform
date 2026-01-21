import { TrailerHero } from '@/components/services/trailer/TrailerHero';
import { TrailerTypes } from '@/components/services/trailer/TrailerTypes';
import { TrailerBookingProcess } from '@/components/services/trailer/TrailerBookingProcess';
import { TrailerLocations } from '@/components/services/trailer/TrailerLocations';
import { TrailerFAQ } from '@/components/services/trailer/TrailerFAQ';

import { ServiceHeroWithChat } from '@/components/services/ServiceHeroWithChat';
export const metadata = {
  title: 'Trailer on Rent - Heavy Duty Trailer Rental Services | TransRentals',
  description: 'Rent trailers for heavy cargo transportation. 20ft, 28ft, 32ft, 40ft trailers available. Book now for best rates across India.',
};

export default function TrailerRentalPage() {
  return (
    <>
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
