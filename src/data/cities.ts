// City data export
export const cities = [
  { name: 'Delhi', slug: 'delhi', state: 'Delhi' },
  { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra' },
  { name: 'Bangalore', slug: 'bangalore', state: 'Karnataka' },
  // Add more cities as needed
];

export function getCityBySlug(slug: string) {
  return cities.find(city => city.slug === slug);
}
