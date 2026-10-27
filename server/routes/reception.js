const express = require("express");

const reception = require("../services/reception");
const availability = require("../services/availability");
const appointmentService = require("../services/appointments");
const time = require("../lib/time");
const v = require("../lib/validate");
const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

router.use(
  requireAuth,
  requireRole("Receptionist")
);

const id = (req, label = "Record") =>
  v.id(req.params.id, label);

/* ---------- Calendar & requests ---------- */

router.get("/appointments", async (req, res) => {
  const today = time.nowInSpa().date;

  const result = await reception.calendar({
    from: req.query.from || today,
    to:
      req.query.to ||
      req.query.from ||
      today,
    therapistId: req.query.therapistId,
    status: req.query.status,
  });

  res.json({
    success: true,
    appointments: result,
  });
});

router.get("/appointments/:id", async (req, res) => {
  const appointment = await appointmentService.mustGet(
    id(req, "Appointment")
  );

  res.json({
    success: true,
    appointment,
  });
});

router.get("/requests", async (req, res) => {
  const result = await reception.pendingRequests();

  res.json({
    success: true,
    appointments: result,
  });
});

/* Slots for staff: includes the current slot (walk-ins). */

router.get("/availability", async (req, res) => {
  const result = await availability.getSlots({
    serviceId: v.id(
      req.query.serviceId,
      "Service"
    ),
    therapistId: v.optionalId(
      req.query.therapistId,
      "Therapist"
    ),
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
      duration_minutes:
        result.service.duration_minutes,
    },
    slots: result.slots,
  });
});

/* ---------- Booking actions ---------- */

router.post("/appointments", async (req, res) => {
  const appointment = await reception.createBooking(
    req.user,
    req.body
  );

  res.status(201).json({
    success: true,
    appointment,
  });
});

router.post(
  "/appointments/:id/confirm",
  async (req, res) => {
    const appointment = await reception.confirm(
      req.user,
      id(req, "Appointment")
    );

    res.json({
      success: true,
      appointment,
    });
  }
);

router.post(
  "/appointments/:id/decline",
  async (req, res) => {
    const appointment = await reception.decline(
      req.user,
      id(req, "Appointment"),
      req.body
    );

    res.json({
      success: true,
      appointment,
    });
  }
);

router.post(
  "/appointments/:id/check-in",
  async (req, res) => {
    const appointment = await reception.checkIn(
      req.user,
      id(req, "Appointment")
    );

    res.json({
      success: true,
      appointment,
    });
  }
);

router.post(
  "/appointments/:id/check-out",
  async (req, res) => {
    const appointment = await reception.checkOut(
      req.user,
      id(req, "Appointment")
    );

    res.json({
      success: true,
      appointment,
    });
  }
);

/* ---------- Payments & receipts ---------- */

router.get("/payment-methods", (req, res) => {
  res.json({
    success: true,
    methods: reception.PAYMENT_METHODS,
  });
});

router.get(
  "/appointments/:id/payments",
  async (req, res) => {
    const receipts = await reception.listPayments(
      id(req, "Appointment")
    );

    res.json({
      success: true,
      receipts,
    });
  }
);

router.post(
  "/appointments/:id/payments",
  async (req, res) => {
    const result = await reception.recordPayment(
      req.user,
      id(req, "Appointment"),
      req.body
    );

    res.status(201).json({
      success: true,
      ...result,
    });
  }
);

router.get(
  "/payments/:id/receipt",
  async (req, res) => {
    const receipt = await reception.buildReceipt(
      id(req, "Payment")
    );

    res.json({
      success: true,
      receipt,
    });
  }
);

router.post(
  "/payments/:id/send-receipt",
  async (req, res) => {
    const result = await reception.sendReceipt(
      req.user,
      id(req, "Payment")
    );

    res.json({
      success: true,
      ...result,
    });
  }
);

/* ---------- Client records ---------- */

router.get("/clients", async (req, res) => {
  const clients = await reception.searchClients(
    req.query.q
  );

  res.json({
    success: true,
    clients,
  });
});

router.get("/clients/:id", async (req, res) => {
  const client = await reception.getClient(
    id(req, "Client")
  );

  res.json({
    success: true,
    client,
  });
});

router.patch("/clients/:id", async (req, res) => {
  const client = await reception.updateClient(
    req.user,
    id(req, "Client"),
    req.body
  );

  res.json({
    success: true,
    client,
  });
});

module.exports = router;