export const messagesData = [
  {
    id: "msg-1",
    type: "support",
    subject: "Booking Inquiry #BK-8829",
    preview: "Hello, I would like to reschedule my appointment...",
    lastMessage: "Sure, we can help with that. What time works best for you?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    unreadCount: 1,
    status: "open",
    participants: [
      { name: "Support Team", avatar: null, role: "admin" },
      { name: "Me", avatar: null, role: "customer" },
    ],
    chatLog: [
      {
        sender: "customer",
        text: "Hello, I would like to reschedule my appointment for tomorrow.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        sender: "admin",
        text: "Sure, we can help with that. What time works best for you?",
        time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: "msg-2",
    type: "provider",
    providerName: "Shield Auto Glass",
    bookingId: "BK-5521",
    subject: "Shield Auto Glass - Appointment Confirmation",
    preview: "Your technician is on the way...",
    lastMessage: "Your technician is on the way. Expected arrival in 15 mins.",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    unreadCount: 0,
    status: "closed",
    participants: [
      { name: "Shield Auto Glass", avatar: null, role: "provider" },
      { name: "Me", avatar: null, role: "customer" },
    ],
    chatLog: [
      {
        sender: "provider",
        text: "Hello, we have confirmed your booking.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
      },
      {
        sender: "provider",
        text: "Your technician is on the way. Expected arrival in 15 mins.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
  },
  {
    id: "msg-3",
    type: "support",
    subject: "Payment Issue #PAY-1002",
    preview: "The payment was processed twice...",
    lastMessage: "We have resolved the duplicate payment and issued a refund.",
    lastMessageTime: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 3
    ).toISOString(), // 3 days ago
    unreadCount: 0,
    status: "closed",
    participants: [
      { name: "Support Team", avatar: null, role: "admin" },
      { name: "Me", avatar: null, role: "customer" },
    ],
    chatLog: [
      {
        sender: "customer",
        text: "The payment was processed twice on my card.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      },
      {
        sender: "admin",
        text: "We are looking into this.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.5).toISOString(),
      },
      {
        sender: "admin",
        text: "We have resolved the duplicate payment and issued a refund.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
    ],
  },
];
