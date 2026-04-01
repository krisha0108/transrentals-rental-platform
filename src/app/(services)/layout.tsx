import { ServiceStoriesSection } from '@/components/services/ServiceStoriesSection';

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ServiceStoriesSection />
    </>
  );
}
