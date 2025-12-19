export const quoteResponsesData = [
  // Responses for QT-1234 (Responses status - 3 responses)
  {
    id: "QR-3001",
    quoteRequestId: "QT-1234",
    provider: {
      id: "PRV-001",
      name: "GlassFit Pro",
      type: "Business",
      rating: 4.8,
      reviewsCount: 156,
      serviceArea: "Johannesburg, Pretoria"
    },
    responseType: "Offer",
    price: 1850,
    currency: "ZAR",
    etaText: "Available 16 Jun 2025",
    message: "Price includes OEM-quality glass and 1-year warranty. Mobile service available at your location.",
    createdAt: "2025-06-12T14:30:00Z",
    status: "Sent"
  },
  {
    id: "QR-3002",
    quoteRequestId: "QT-1234",
    provider: {
      id: "PRV-002",
      name: "ClearView Auto Glass",
      type: "Business",
      rating: 4.5,
      reviewsCount: 89,
      serviceArea: "Johannesburg"
    },
    responseType: "Offer",
    price: 1650,
    currency: "ZAR",
    etaText: "Available 17 Jun 2025",
    message: "Aftermarket glass option with 6-month warranty. Workshop service only - free parking available.",
    createdAt: "2025-06-12T16:45:00Z",
    status: "Sent"
  },
  {
    id: "QR-3003",
    quoteRequestId: "QT-1234",
    provider: {
      id: "PRV-003",
      name: "AutoGlass Express",
      type: "Individual",
      rating: 4.2,
      reviewsCount: 45,
      serviceArea: "Gauteng"
    },
    responseType: "Counter",
    price: 1950,
    currency: "ZAR",
    etaText: "Same-day service available",
    message: "Premium OEM glass with lifetime warranty. I can come to your location today if needed.",
    createdAt: "2025-06-13T09:00:00Z",
    status: "Sent"
  },
  // Responses for QT-1230 (Accepted status - 2 responses)
  {
    id: "QR-2998",
    quoteRequestId: "QT-1230",
    provider: {
      id: "PRV-002",
      name: "ClearView Auto Glass",
      type: "Business",
      rating: 4.5,
      reviewsCount: 89,
      serviceArea: "Johannesburg"
    },
    responseType: "Offer",
    price: 450,
    currency: "ZAR",
    etaText: "Available 10 Jun 2025",
    message: "Quick chip repair with quality resin. 30-minute service.",
    createdAt: "2025-06-06T10:00:00Z",
    status: "Rejected"
  },
  {
    id: "QR-2999",
    quoteRequestId: "QT-1230",
    provider: {
      id: "PRV-001",
      name: "GlassFit Pro",
      type: "Business",
      rating: 4.8,
      reviewsCount: 156,
      serviceArea: "Johannesburg, Pretoria"
    },
    responseType: "Offer",
    price: 520,
    currency: "ZAR",
    etaText: "Available 11 Jun 2025",
    message: "Premium repair with lifetime warranty on workmanship. Mobile service included.",
    createdAt: "2025-06-06T14:20:00Z",
    status: "Accepted"
  }
];
