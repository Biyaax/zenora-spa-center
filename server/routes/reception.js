const express = require("express");

const reception = require("../services/reception");
const availability = require("../services/availability");
const appointments = require("../services/appointments");
const time = require("../lib/time");
const v = require("../lib/validate");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("Receptionist"));

const id = (req, label = "Record") => v.id(req.params.id, label);

/* ---------- Calendar & requests ---------- */

router.get("/appointments", (req, res) => {
  const today = time.nowInSpa().date;

  const appointments = reception.calendar({
    from: req.query.from || today,
    to: req.query.to || req.query.from || today,
    therapistId: req.query.therapistId,
    status: req.query.status,
  });

  res.json({ success: true, appointments });
});

router.get("/appointments/:id", (req, res) => {
  res.json({
    success: true,
    appointment: appointments.mustGet(id(req, "Appointment")),
  });
});

router.get("/requests", (req, res) => {
  res.json({ success: true, appointments: reception.pendingRequests() });
});

/* Slots for staff: includes the current slot (walk-ins). */
router.get("/availability", (req, res) => {
  const result = availability.getSlots({
    serviceId: v.id(req.query.serviceId, "Service"),
    therapistId: v.optionalId(req.query.therapistId, "Therapist"),
    date: req.query.date,
    forStaff: true,
  });

  res.json({
    success: true,
    closed: result.closed,
    service: {
      id: result.service.id,
      name: result.service.name,
      price: result.service.price,
      duration_minutes: result.service.duration_minutes,
    },
    slots: result.slots,
  });
});

/* ---------- Booking actions ---------- */

router.post("/appointments", (req, res) => {
  const appointment = reception.createBooking(req.user, req.body);
  res.status(201).json({ success: true, appointment });
});

router.post("/appointments/:id/confirm", (req, res) => {
  res.json({
    success: true,
    appointment: reception.confirm(req.user, id(req, "Appointment")),
  });
});

router.post("/appointments/:id/decline", (req, res) => {
  res.json({
    success: true,
    appointment: reception.decline(req.user, id(req, "Appointment"), req.body),
  });
});

router.post("/appointments/:id/check-in", (req, res) => {
  res.json({
    success: true,
    appointment: reception.checkIn(req.user, id(req, "Appointment")),
  });
});

router.post("/appointments/:id/check-out", (req, res) => {
  res.json({
    success: true,
    appointment: reception.checkOut(req.user, id(req, "Appointment")),
  });
});

/* ---------- Payments & receipts ---------- */

router.get("/payment-methods", (req, res) => {
  res.json({ success: true, methods: reception.PAYMENT_METHODS });
});

router.get("/appointments/:id/payments", (req, res) => {
  res.json({
    success: true,
    receipts: reception.listPayments(id(req, "Appointment")),
  });
});

router.post("/appointments/:id/payments", (req, res) => {
  const result = reception.recordPayment(
    req.user,
    id(req, "Appointment"),
    req.body
  );
  res.status(201).json({ success: true, ...result });
});

router.get("/payments/:id/receipt", (req, res) => {
  res.json({
    success: true,
    receipt: reception.buildReceipt(id(req, "Payment")),
  });
});

router.post("/payments/:id/send-receipt", async (req, res) => {
  const result = await reception.sendReceipt(req.user, id(req, "Payment"));
  res.json({ success: true, ...result });
});

/* ---------- Client records ---------- */

router.get("/clients", (req, res) => {
  res.json({ success: true, clients: reception.searchClients(req.query.q) });
});

router.get("/clients/:id", (req, res) => {
  res.json({ success: true, client: reception.getClient(id(req, "Client")) });
});

router.patch("/clients/:id", (req, res) => {
  res.json({
    success: true,
    client: reception.updateClient(req.user, id(req, "Client"), req.body),
  });
});

module.exports = router;
