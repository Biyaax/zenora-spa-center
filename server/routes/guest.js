const express = require("express");

const guest = require("../services/guest");
const v = require("../lib/validate");
const {
  requireAuth,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

/* ---------- Notifications (any logged-in user) ---------- */

router.get("/notifications", async (req, res) => {
  const result = await guest.listNotifications(req.user);

  res.json({
    success: true,
    ...result,
  });
});

router.post("/notifications/read-all", async (req, res) => {
  await guest.markAllRead(req.user);

  res.json({
    success: true,
  });
});

router.post("/notifications/:id/read", async (req, res) => {
  await guest.markRead(
    req.user,
    v.id(req.params.id, "Notification")
  );

  res.json({
    success: true,
  });
});

/* ---------- Guest bookings ---------- */

router.use(requireRole("Guest"));

router.get("/appointments", async (req, res) => {
  const result = await guest.listMine(req.user);

  res.json({
    success: true,
    ...result,
  });
});

router.post("/appointments", async (req, res) => {
  const appointment = await guest.book(
    req.user,
    req.body
  );

  res.status(201).json({
    success: true,
    appointment,
  });
});

router.get(
  "/appointments/:id/availability",
  async (req, res) => {
    const result = await guest.slotsForReschedule(
      req.user,
      v.id(req.params.id, "Appointment"),
      req.query.date,
      v.optionalId(
        req.query.therapistId,
        "Therapist"
      )
    );

    res.json({
      success: true,
      closed: result.closed,
      slots: result.slots,
    });
  }
);

router.patch(
  "/appointments/:id/reschedule",
  async (req, res) => {
    const appointment = await guest.reschedule(
      req.user,
      v.id(req.params.id, "Appointment"),
      req.body
    );

    res.json({
      success: true,
      appointment,
    });
  }
);

router.post(
  "/appointments/:id/cancel",
  async (req, res) => {
    const appointment = await guest.cancel(
      req.user,
      v.id(req.params.id, "Appointment"),
      req.body
    );

    res.json({
      success: true,
      appointment,
    });
  }
);

module.exports = router;