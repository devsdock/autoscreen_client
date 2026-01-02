// Customer Addresses
export const addressesData = [
  {
    id: "ADDR-001",
    label: "Home",
    line1: "123 Main Road",
    suburb: "Sandton",
    city: "Johannesburg",
    postcode: "2196",
    coordinates: { lat: -26.107567, lng: 28.056702 },
    isDefault: true,
  },
  {
    id: "ADDR-002",
    label: "Work",
    line1: "45 Oxford Street, Block B",
    suburb: "Rosebank",
    city: "Johannesburg",
    postcode: "2196",
    coordinates: { lat: -26.145392, lng: 28.041953 },
  },
];

// South African cities
export const cities = [
  "Johannesburg",
  "Pretoria",
  "Cape Town",
  "Durban",
  "Port Elizabeth",
  "Bloemfontein",
  "East London",
  "Polokwane",
  "Nelspruit",
  "Rustenburg",
  "Kimberley",
  "Pietermaritzburg",
];

// Address labels
export const addressLabels = ["Home", "Work", "Other"];

export default addressesData;
