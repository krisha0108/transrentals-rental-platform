interface AirportLocation {
  name: string;
  slug: string;
  type: string;
  parentCityName?: string;
}

function getAirportSlugForSEO(airportSlug: string): string {
  // Remove 3-letter IATA code suffix: ahmedabad-airport-amd -> ahmedabad-airport
  return airportSlug.replace(/-[a-z]{3}$/i, '');
}

export function generateAirportSEOSlug(
  fromLocation: AirportLocation,
  toLocation: AirportLocation
): string {
  const isAirportPickup = fromLocation.type === 'AIRPORT';

  if (isAirportPickup) {
    const airportSlug = getAirportSlugForSEO(fromLocation.slug);
    const airportCityName = fromLocation.parentCityName || '';
    const isSameCity =
      airportCityName.toLowerCase().includes(toLocation.name.toLowerCase()) ||
      toLocation.name.toLowerCase().includes(airportCityName.toLowerCase());

    return isSameCity
      ? `${airportSlug}-to-city`
      : `${airportSlug}-to-${toLocation.slug}`;
  } else {
    const airportSlug = getAirportSlugForSEO(toLocation.slug);
    const airportCityName = toLocation.parentCityName || '';
    const isSameCity =
      airportCityName.toLowerCase().includes(fromLocation.name.toLowerCase()) ||
      fromLocation.name.toLowerCase().includes(airportCityName.toLowerCase());

    return isSameCity
      ? `city-to-${airportSlug}`
      : `${fromLocation.slug}-to-${airportSlug}`;
  }
}
