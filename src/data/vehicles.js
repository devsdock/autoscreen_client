export const vehiclesData = [
  {
    id: "VEH-001",
    make: "Toyota",
    model: "Corolla",
    year: 2019,
    bodyType: "Sedan",
    registration: "CA 123-456",
  },
  {
    id: "VEH-002",
    make: "Ford",
    model: "Ranger",
    year: 2021,
    bodyType: "Bakkie",
    registration: "GP 789-012",
  },
];

// vehicleMakes and commonSAModels removed — now sourced from backend database
// via vehicleService.js (GET /api/public/vehicles)

export const bodyTypes = [
  "Sedan",
  "Hatchback",
  "SUV",
  "Bakkie",
  "Van",
  "Coupe",
  "Wagon",
  "Other",
];

export const yearOptions = Array.from({ length: 16 }, (_, i) => 2025 - i);
