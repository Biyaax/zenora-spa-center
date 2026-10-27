const express = require("express");

const guest = require("../services/guest");
const v = require("../lib/validate");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

/* ---------- Notifications (any logged-in user) ---------- */

router.get("/notifications", (req, res) => {
  res.json({ success: true, ...guest.listNotifications(req.user) });
});

router.post("/notifications/read-all", (req, res) => {
  guest.markAllRead(req.user);
  res.json({ success: true });
});

router.post("/notifications/:id/read", (req, res) => {
  guest.markRead(req.user, v.id(req.params.id, "Notification"));
  res.json({ success: true });
});

/* ---------- Guest bookings ---------- */

router.use(requireRole("Guest"));

router.get("/appointments", (req, res) => {
  res.json({ success: true, ...guest.listMine(req.user) });
});

router.post("/appointments", (req, res) => {
  const appointment = guest.book(req.user, req.body);
  res.status(201).json({ success: true, appointment });
});

router.get("/appointments/:id/availability", (req, res) => {
  const result = guest.slotsForReschedule(
    req.user,
    v.id(req.params.id, "Appointment"),
    req.query.date,
    v.optionalId(req.query.therapistId, "Therapist")
  );
  res.json({ success: true, closed: result.closed, slots: result.slots });
});

router.patch("/appointments/:id/reschedule", (req, res) => {
  const appointment = guest.reschedule(
    req.user,
    v.id(req.params.id, "Appointment"),
    req.body
  );
  res.json({ success: true, appointment });
});

router.post("/appointments/:id/cancel", (req, res) => {
  const appointment = guest.cancel(
    req.user,
    v.id(req.params.id, "Appointment"),
    req.body
  );
  res.json({ success: true, appointment });
});

module.exports = router;
