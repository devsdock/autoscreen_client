export const quotesData = [
  {
    id: "QT-1234",
    reference: "Q-2025-00124",
    customerId: "USR-001",
    createdAt: "2025-06-12T10:30:00Z",
    status: "Responses",
    vehicle: {
      make: "Toyota",
      model: "Corolla",
      year: 2019
    },
    serviceType: "Replacement",
    glassType: "Windscreen",
    location: {
      city: "Johannesburg",
      postcode: "2196",
      addressLine1: "123 Main Road, Sandton"
    },
    preferredDate: "2025-06-18",
    preferredTimeSlot: "Morning (08:00 - 12:00)",
    notes: "Crack on driver side, approximately 15cm long. Need urgent replacement.",
    images: [],
    responsesCount: 3
  },
  {
    id: "QT-1235",
    reference: "Q-2025-00125",
    customerId: "USR-001",
    createdAt: "2025-06-14T08:15:00Z",
    status: "Open",
    vehicle: {
      make: "Ford",
      model: "Ranger",
      year: 2021
    },
    serviceType: "Replacement",
    glassType: "Side Window (Front Right)",
    location: {
      city: "Johannesburg",
      postcode: "2196",
      addressLine1: "456 Office Park, Rosebank"
    },
    preferredDate: "2025-06-20",
    preferredTimeSlot: "Afternoon (12:00 - 17:00)",
    notes: "",
    images: [],
    responsesCount: 0
  },
  {
    id: "QT-1230",
    reference: "Q-2025-00120",
    customerId: "USR-001",
    createdAt: "2025-06-01T14:00:00Z",
    status: "Accepted",
    vehicle: {
      make: "Toyota",
      model: "Corolla",
      year: 2019
    },
    serviceType: "Repair",
    glassType: "Windscreen",
    location: {
      city: "Johannesburg",
      postcode: "2196",
      addressLine1: "123 Main Road, Sandton"
    },
    preferredDate: "2025-06-10",
    preferredTimeSlot: "Morning (08:00 - 12:00)",
    notes: "Small chip from stone, driver side",
    images: [],
    responsesCount: 2,
    acceptedResponseId: "QR-3001"
  },
  {
    id: "QT-1228",
    reference: "Q-2025-00118",
    customerId: "USR-001",
    createdAt: "2025-05-15T09:00:00Z",
    status: "Closed",
    vehicle: {
      make: "Toyota",
      model: "Corolla",
      year: 2019
    },
    serviceType: "Replacement",
    glassType: "Rear Window",
    location: {
      city: "Johannesburg",
      postcode: "2196",
      addressLine1: "123 Main Road, Sandton"
    },
    preferredDate: "2025-05-20",
    preferredTimeSlot: "Any time",
    notes: "No longer needed - found alternative",
    images: [],
    responsesCount: 0
  },
  {
    id: "QT-1236",
    reference: "Q-2025-00126",
    customerId: "USR-001",
    createdAt: "2025-06-15T11:30:00Z",
    status: "Open",
    vehicle: {
      make: "BMW",
      model: "3 Series",
      year: 2020
    },
    serviceType: "Repair",
    glassType: "Windscreen",
    location: {
      city: "Pretoria",
      postcode: "0181",
      addressLine1: "78 Church Street, Arcadia"
    },
    preferredDate: "2025-06-22",
    preferredTimeSlot: "Morning (08:00 - 12:00)",
    notes: "Small stone chip, about 2cm from edge",
    images: [],
    responsesCount: 0
  }
];

export const glassTypes = [
  "Windscreen",
  "Side Window (Front Left)",
  "Side Window (Front Right)",
  "Side Window (Rear Left)",
  "Side Window (Rear Right)",
  "Rear Window",
  "Quarter Glass",
  "Sunroof"
];

export const serviceTypes = ["Repair", "Replacement"];

export const timeSlots = [
  "Morning (08:00 - 12:00)",
  "Afternoon (12:00 - 17:00)",
  "Evening (17:00 - 20:00)",
  "Any time"
];

export const vehicleMakes = [
  "Audi",
  "BMW",
  "Chevrolet",
  "Ford",
  "Honda",
  "Hyundai",
  "Isuzu",
  "Kia",
  "Mazda",
  "Mercedes-Benz",
  "Nissan",
  "Opel",
  "Renault",
  "Suzuki",
  "Toyota",
  "Volkswagen",
  "Volvo",
  "Other"
];

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
  "Rustenburg"
];
