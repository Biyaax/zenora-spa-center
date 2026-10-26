
import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

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

// ================= STAFF LOGIN =================

import StaffLogin from "./pages/StaffLogin";

// ================= MANAGER PAGES =================

import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerServices from "./pages/manager/ManagerServices";
import ManagerTherapists from "./pages/manager/ManagerTherapists";
import ManagerTimeOff from "./pages/manager/ManagerTimeOff";
import ManagerPaymentReports from "./pages/manager/ManagerPaymentReports";
import ManagerActivityLogs from "./pages/manager/ManagerActivityLogs";

// ================= THERAPIST PAGES =================

import TherapistDashboard from "./pages/therapist/TherapistDashboard";

// ================= STAFF ROUTE PROTECTION =================

import StaffProtectedRoute from "./components/StaffProtectedRoute";

function App() {
  const location = useLocation();

  const isStaffPage =
    location.pathname.startsWith("/receptionist") ||
    location.pathname.startsWith("/manager") ||
    location.pathname.startsWith("/therapist");

  return (
    <>
      {/* ================= HEADER ================= */}

      {!isStaffPage && (
        <>
          <Topbar />
          <Navbar />
        </>
      )}

      {/* ================= MAIN CONTENT ================= */}

      <main>
        <Routes>

          {/* ================= PUBLIC PAGES ================= */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/services"
            element={<Services />}
          />

          <Route
            path="/pricing"
            element={<Pricing />}
          />

          <Route
            path="/appointment"
            element={<Appointment />}
          />

          <Route
            path="/opening"
            element={<Opening />}
          />

          <Route
            path="/team"
            element={<Team />}
          />

          <Route
            path="/testimonial"
            element={<Testimonial />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          {/* ================= STAFF LOGIN ================= */}

          <Route
            path="/staff/login"
            element={<StaffLogin />}
          />

          {/* ================= GUEST PAGES ================= */}

          <Route
            path="/guest/dashboard"
            element={<GuestDashboard />}
          />

          <Route
            path="/guest/appointments"
            element={<MyAppointments />}
          />

          <Route
            path="/guest/history"
            element={<BookingHistory />}
          />

          <Route
            path="/guest/notifications"
            element={<Notifications />}
          />

          {/* ================= RECEPTIONIST PAGES ================= */}

          <Route
            path="/receptionist/dashboard"
            element={<ReceptionistDashboard />}
          />

          <Route
            path="/receptionist/bookings"
            element={<Bookings />}
          />

          <Route
            path="/receptionist/walk-in"
            element={<WalkInBooking />}
          />

          <Route
            path="/receptionist/check-in-out"
            element={<CheckInOut />}
          />

          <Route
            path="/receptionist/payments"
            element={<Payments />}
          />

          <Route
            path="/receptionist/clients"
            element={<Clients />}
          />

          {/* ================= SPA MANAGER ================= */}

          <Route
            path="/manager/dashboard"
            element={
              <StaffProtectedRoute allowedRole="Spa Manager">
                <ManagerDashboard />
              </StaffProtectedRoute>
            }
          />

          <Route
            path="/manager/services"
            element={
              <StaffProtectedRoute allowedRole="Spa Manager">
                <ManagerServices />
              </StaffProtectedRoute>
            }
          />

          <Route
            path="/manager/therapists"
            element={
              <StaffProtectedRoute allowedRole="Spa Manager">
                <ManagerTherapists />
              </StaffProtectedRoute>
            }
          />

          <Route
            path="/manager/time-off"
            element={
              <StaffProtectedRoute allowedRole="Spa Manager">
                <ManagerTimeOff />
              </StaffProtectedRoute>
            }
          />  

          <Route
            path="/manager/reports/payments"
            element={
              <StaffProtectedRoute allowedRole="Spa Manager">
                <ManagerPaymentReports />
              </StaffProtectedRoute>
            }
          />  

          <Route
            path="/manager/activity-logs"
            element={
              <StaffProtectedRoute allowedRole="Spa Manager">
                <ManagerActivityLogs />
              </StaffProtectedRoute>
            }
          />

          {/* ================= MASSAGE THERAPIST ================= */}

          <Route
            path="/therapist/dashboard"
            element={
              <StaffProtectedRoute allowedRole="Massage Therapist">
                <TherapistDashboard />
              </StaffProtectedRoute>
            }
          />

        </Routes>
      </main>

      {/* ================= FOOTER ================= */}

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
