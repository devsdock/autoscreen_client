export const bookingsData = [
  {
    id: "BK-5678",
    quoteId: "QT-1230",
    quoteResponseId: "QR-3001",
    customerId: "USR-001",
    providerId: "PRV-001",
    providerName: "GlassFit Pro",
    providerPhone: "+27 11 234 5678",
    providerRating: 4.8,
    providerReviews: 156,
    service: "Windscreen Replacement",
    vehicle: "2019 Toyota Corolla",
    scheduledDate: "2025-06-18T09:00:00Z",
    locationType: "Mobile",
    address: "123 Main Road, Sandton, Johannesburg",
    notes: "Crack on driver side",
    status: "Confirmed",
    paymentStatus: "Unpaid",
    price: {
      service: 1650,
      callout: 150,
      materials: 50,
      total: 1850
    },
    timeline: [
      { status: "Quote Accepted", date: "2025-06-14T10:00:00Z", completed: true },
      { status: "Booking Confirmed", date: "2025-06-15T14:30:00Z", completed: true },
      { status: "Appointment Scheduled", date: "2025-06-18T09:00:00Z", completed: false },
      { status: "Job Completed", date: null, completed: false },
      { status: "Payment Received", date: null, completed: false }
    ],
    createdAt: "2025-06-14T10:00:00Z"
  },
  {
    id: "BK-5672",
    quoteId: "QT-1225",
    quoteResponseId: "QR-2998",
    customerId: "USR-001",
    providerId: "PRV-002",
    providerName: "ClearView Auto Glass",
    providerPhone: "+27 11 345 6789",
    providerRating: 4.5,
    providerReviews: 89,
    service: "Chip Repair",
    vehicle: "2019 Toyota Corolla",
    scheduledDate: "2025-06-10T11:00:00Z",
    locationType: "Workshop",
    address: "45 Industrial Road, Wynberg, Johannesburg",
    notes: "",
    status: "Completed",
    paymentStatus: "Paid",
    price: {
      service: 450,
      callout: 0,
      materials: 0,
      total: 450
    },
    timeline: [
      { status: "Quote Accepted", date: "2025-06-08T09:00:00Z", completed: true },
      { status: "Booking Confirmed", date: "2025-06-08T14:00:00Z", completed: true },
      { status: "Appointment Scheduled", date: "2025-06-10T11:00:00Z", completed: true },
      { status: "Job Completed", date: "2025-06-10T12:30:00Z", completed: true },
      { status: "Payment Received", date: "2025-06-10T12:45:00Z", completed: true }
    ],
    createdAt: "2025-06-08T09:00:00Z"
  },
  {
    id: "BK-5665",
    quoteId: "QT-1220",
    customerId: "USR-001",
    providerId: "PRV-001",
    providerName: "GlassFit Pro",
    providerPhone: "+27 11 234 5678",
    providerRating: 4.8,
    providerReviews: 156,
    service: "Side Window Replacement",
    vehicle: "2021 Ford Ranger",
    scheduledDate: "2025-05-28T14:00:00Z",
    locationType: "Mobile",
    address: "456 Office Park, Rosebank, Johannesburg",
    notes: "Break-in damage",
    status: "Completed",
    paymentStatus: "Paid",
    price: {
      service: 1100,
      callout: 100,
      materials: 0,
      total: 1200
    },
    timeline: [
      { status: "Quote Accepted", date: "2025-05-26T08:00:00Z", completed: true },
      { status: "Booking Confirmed", date: "2025-05-26T10:00:00Z", completed: true },
      { status: "Appointment Scheduled", date: "2025-05-28T14:00:00Z", completed: true },
      { status: "Job Completed", date: "2025-05-28T15:30:00Z", completed: true },
      { status: "Payment Received", date: "2025-05-28T16:00:00Z", completed: true }
    ],
    createdAt: "2025-05-26T08:00:00Z"
  },
  {
    id: "BK-5660",
    quoteId: "QT-1218",
    customerId: "USR-001",
    providerId: "PRV-003",
    providerName: "AutoGlass Express",
    providerPhone: "+27 11 456 7890",
    providerRating: 4.2,
    providerReviews: 45,
    service: "Rear Window Replacement",
    vehicle: "2019 Toyota Corolla",
    scheduledDate: "2025-05-20T10:00:00Z",
    locationType: "Workshop",
    address: "78 Main Street, Braamfontein, Johannesburg",
    notes: "",
    status: "Cancelled",
    paymentStatus: "Refunded",
    cancellationReason: "Found another provider",
    price: {
      service: 2200,
      callout: 0,
      materials: 100,
      total: 2300
    },
    timeline: [
      { status: "Quote Accepted", date: "2025-05-18T11:00:00Z", completed: true },
      { status: "Booking Confirmed", date: "2025-05-18T15:00:00Z", completed: true },
      { status: "Cancelled", date: "2025-05-19T09:00:00Z", completed: true }
    ],
    createdAt: "2025-05-18T11:00:00Z"
  },
  {
    id: "BK-5655",
    quoteId: "QT-1215",
    customerId: "USR-001",
    providerId: "PRV-001",
    providerName: "GlassFit Pro",
    providerPhone: "+27 11 234 5678",
    providerRating: 4.8,
    providerReviews: 156,
    service: "Windscreen Repair",
    vehicle: "2019 Toyota Corolla",
    scheduledDate: "2025-05-10T10:00:00Z",
    locationType: "Mobile",
    address: "123 Main Road, Sandton, Johannesburg",
    notes: "Small stone chip",
    status: "Completed",
    paymentStatus: "Paid",
    price: {
      service: 350,
      callout: 100,
      materials: 0,
      total: 450
    },
    timeline: [
      { status: "Quote Accepted", date: "2025-05-08T09:00:00Z", completed: true },
      { status: "Booking Confirmed", date: "2025-05-08T11:00:00Z", completed: true },
      { status: "Appointment Scheduled", date: "2025-05-10T10:00:00Z", completed: true },
      { status: "Job Completed", date: "2025-05-10T10:45:00Z", completed: true },
      { status: "Payment Received", date: "2025-05-10T11:00:00Z", completed: true }
    ],
    createdAt: "2025-05-08T09:00:00Z"
  }
];


