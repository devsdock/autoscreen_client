export const CITIES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
].sort();

export const CITY_COORDINATES = {
  "Eastern Cape": { lat: -32.2968, lng: 26.4194 },
  "Free State": { lat: -28.4541, lng: 26.7968 },
  Gauteng: { lat: -26.2708, lng: 28.1123 },
  "KwaZulu-Natal": { lat: -28.5306, lng: 30.8958 },
  Limpopo: { lat: -23.4013, lng: 29.4179 },
  Mpumalanga: { lat: -25.5656, lng: 30.5279 },
  "North West": { lat: -26.6639, lng: 25.2838 },
  "Northern Cape": { lat: -29.0467, lng: 21.8569 },
  "Western Cape": { lat: -33.2278, lng: 21.8569 },
};

export const getCityCoordinates = (city) => {
  return CITY_COORDINATES[city] || null;
};
