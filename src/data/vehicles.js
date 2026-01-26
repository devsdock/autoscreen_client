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

export const vehicleMakes = [
  "Toyota",
  "Ford",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Nissan",
  "Mazda",
  "Honda",
  "Hyundai",
  "Kia",
  "Chevrolet",
  "Jeep",
  "Land Rover",
  "Isuzu",
  "Suzuki",
  "Renault",
  "Peugeot",
  "Opel",
  "Mitsubishi",
  "Other",
];

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
