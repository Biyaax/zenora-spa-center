const guestNotifications = [
  {
    id: 1,
    type: "confirmation",
    title: "Booking Confirmed",
    message:
      "Your Body Massage appointment with Maria Santos on October 28, 2026 at 2:00 PM has been confirmed.",
    date: "2026-10-24",
    time: "10:30 AM",
    isRead: false,
  },
  {
    id: 2,
    type: "reminder",
    title: "Upcoming Appointment Reminder",
    message:
      "You have a Body Massage appointment on October 28, 2026 at 2:00 PM. Please arrive at least 10 minutes early.",
    date: "2026-10-24",
    time: "9:00 AM",
    isRead: false,
  },
  {
    id: 3,
    type: "reschedule",
    title: "Appointment Rescheduled",
    message:
      "Your Facial Therapy appointment has been moved to November 5, 2026 at 10:00 AM.",
    date: "2026-10-20",
    time: "4:15 PM",
    isRead: true,
  },
  {
    id: 4,
    type: "completed",
    title: "Appointment Completed",
    message:
      "Thank you for visiting Zenora. Your Stone Therapy appointment has been marked as completed.",
    date: "2026-09-20",
    time: "2:30 PM",
    isRead: true,
  },
];

export default guestNotifications;