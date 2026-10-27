
import { Routes, Route, Outlet, useLocation } from "react-router-dom";

// ================= PUBLIC LAYOUT =================
import Topbar from "./components/Topbar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";

// ================= PUBLIC PAGES =================
import About from "./pages/About";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import Appointment from "./pages/Appointment";
import Opening from "./pages/Opening";
import Team from "./pages/Team";
import Testimonial from "./pages/Testimonial";
import Contact from "./pages/Contact";

// ================= GUEST PAGES =================
import GuestDashboard from "./pages/guest/GuestDashboard";
import MyAppointments from "./pages/guest/MyAppointments";
import BookingHistory from "./pages/guest/BookingHistory";
import Notifications from "./pages/guest/Notifications";

// ================= RECEPTIONIST PAGES =================
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import Bookings from "./pages/receptionist/Bookings";
import CheckInOut from "./pages/receptionist/CheckInOut";
import WalkInBooking from "./pages/receptionist/WalkInBooking";
import Payments from "./pages/receptionist/Payments";
import Clients from "./pages/receptionist/Clients";

// ================= STAFF AUTHENTICATION =================
import StaffLogin from "./pages/StaffLogin";
import StaffProtectedRoute from "./components/StaffProtectedRoute";

// ================= SPA MANAGER PAGES =================
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerServices from "./pages/manager/ManagerServices";
import ManagerTherapists from "./pages/manager/ManagerTherapists";
import ManagerTimeOff from "./pages/manager/ManagerTimeOff";
import ManagerPaymentReports from "./pages/manager/ManagerPaymentReports";
import ManagerActivityLogs from "./pages/manager/ManagerActivityLogs";

// NEW: Shared Spa Manager layout
import AppShell from "./components/manager/AppShell";

// ================= MASSAGE THERAPIST =================
// Preserve the completed Therapist Portal v7.
import TherapistPortal from "./pages/therapist/TherapistPortal";

function App() {
  const location = useLocation();

  // Hide the public navbar/footer inside staff dashboards.
  const isStaffPage = ["/receptionist", "/therapist", "/manager"].some(
    (prefix) =>
      location.pathname === prefix ||
      location.pathname.startsWith(`${prefix}/`)
  );

  return (
    <>
      {!isStaffPage && (
        <>
          <Topbar />
          <Navbar />
        </>
      )}

      <main>
        <Routes>
          {/* ================= PUBLIC PAGES ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/opening" element={<Opening />} />
          <Route path="/team" element={<Team />} />
          <Route path="/testimonial" element={<Testimonial />} />
          <Route path="/contact" element={<Contact />} />

          {/* ================= STAFF LOGIN ================= */}
          <Route path="/staff/login" element={<StaffLogin />} />

          {/* ================= GUEST PAGES ================= */}
          <Route path="/guest/dashboard" element={<GuestDashboard />} />
          <Route path="/guest/appointments" element={<MyAppointments />} />
          <Route path="/guest/history" element={<BookingHistory />} />
          <Route path="/guest/notifications" element={<Notifications />} />

          {/* ================= RECEPTIONIST PAGES ================= */}
          <Route
            path="/receptionist/dashboard"
            element={<ReceptionistDashboard />}
          />
          <Route path="/receptionist/bookings" element={<Bookings />} />
          <Route path="/receptionist/walk-in" element={<WalkInBooking />} />
          <Route path="/receptionist/check-in-out" element={<CheckInOut />} />
          <Route path="/receptionist/payments" element={<Payments />} />
          <Route path="/receptionist/clients" element={<Clients />} />

          {/* ================= SPA MANAGER ROUTES ================= */}
          {/* All Manager pages now share the redesigned AppShell. */}
          <Route
            element={
              <StaffProtectedRoute allowedRole="Spa Manager">
                <AppShell />
              </StaffProtectedRoute>
            }
          >
            <Route
              path="/manager/dashboard"
              element={<ManagerDashboard />}
            />
            <Route
              path="/manager/services"
              element={<ManagerServices />}
            />
            <Route
              path="/manager/therapists"
              element={<ManagerTherapists />}
            />
            <Route
              path="/manager/time-off"
              element={<ManagerTimeOff />}
            />
            <Route
              path="/manager/reports/payments"
              element={<ManagerPaymentReports />}
            />
            <Route
              path="/manager/activity-logs"
              element={<ManagerActivityLogs />}
            />
          </Route>

          {/* ================= MASSAGE THERAPIST ROUTES ================= */}
          {/* Keep the completed Therapist Portal v7 unchanged. */}
          <Route
            element={
              <StaffProtectedRoute allowedRole="Massage Therapist">
                <Outlet />
              </StaffProtectedRoute>
            }
          >
            <Route
              path="/therapist/dashboard"
              element={<TherapistPortal />}
            />
            <Route
              path="/therapist/schedule"
              element={<TherapistPortal />}
            />
            <Route
              path="/therapist/appointments"
              element={<TherapistPortal />}
            />
            <Route
              path="/therapist/availability"
              element={<TherapistPortal />}
            />
            <Route
              path="/therapist/profile"
              element={<TherapistPortal />}
            />
            <Route
              path="/therapist/notes"
              element={<TherapistPortal />}
            />
          </Route>
        </Routes>
      </main>

      {!isStaffPage && (
        <>
          <Footer />
          <BackToTop />
        </>
      )}
    </>
  );
}

export default App;
