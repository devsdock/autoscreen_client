export const quotesData = [
  {
    id: "QT-1234",
    vehicleId: "VEH-001",
    vehicle: "2019 Toyota Corolla",
    glassType: "Windscreen",
    serviceType: "Replacement",
    location: "Sandton, Johannesburg",
    addressId: "ADDR-001",
    notes: "Crack on driver side, approximately 15cm long",
    status: "Received Responses",
    dateRequested: "2025-06-12T10:30:00Z",
    responsesCount: 3
  },
  {
    id: "QT-12356",
    vehicleId: "VEH-002",
    vehicle: "2021 Ford Ranger",
    glassType: "Side Window (Front Right)",
    serviceType: "Replacement",
    location: "Rosebank, Johannesburg",
    addressId: "ADDR-002",
    notes: "",
    status: "Open",
    dateRequested: "2025-06-14T08:15:00Z",
    responsesCount: 0
  },
  {
    id: "QT-1230",
    vehicleId: "VEH-001",
    vehicle: "2019 Toyota Corolla",
    glassType: "Windscreen",
    serviceType: "Repair",
    location: "Sandton, Johannesburg",
    addressId: "ADDR-001",
    notes: "Small chip from stone",
    status: "Accepted",
    dateRequested: "2025-06-01T14:00:00Z",
    responsesCount: 2,
    acceptedResponseId: "QR-3001"
  },
  {
    id: "QT-1228",
    vehicleId: "VEH-001",
    vehicle: "2019 Toyota Corolla",
    glassType: "Rear Window",
    serviceType: "Replacement",
    location: "Sandton, Johannesburg",
    addressId: "ADDR-001",
    notes: "",
    status: "Expired",
    dateRequested: "2025-05-15T09:00:00Z",
    responsesCount: 0
  },
  {
    id: "QT-1225",
    vehicleId: "VEH-002",
    vehicle: "2021 Ford Ranger",
    glassType: "Windscreen",
    serviceType: "Repair",
    location: "Rosebank, Johannesburg",
    addressId: "ADDR-002",
    notes: "Stone chip on passenger side",
    status: "Accepted",
    dateRequested: "2025-06-05T11:30:00Z",
    responsesCount: 3,
    acceptedResponseId: "QR-2998"
  }
];

export const glassTypes = [
  "Windscreen",
  "Side Window (Front Left)",
  "Side Window (Front Right)",
  "Side Window (Rear Left)",
  "Side Window (Rear Right)",
  "Rear Window",
  "Quarter Glass"
];

export const serviceTypes = ["Repair", "Replacement"];

export const locationTypes = ["Mobile", "Workshop"];

