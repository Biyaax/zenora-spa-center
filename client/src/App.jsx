import {
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";

// Public layout
import Topbar from "./components/Topbar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";

// Public pages
import About from "./pages/About";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import Appointment from "./pages/Appointment";
import Opening from "./pages/Opening";
import Team from "./pages/Team";
import Testimonial from "./pages/Testimonial";
import Contact from "./pages/Contact";

// Guest pages
import GuestDashboard from "./pages/guest/GuestDashboard";
import MyAppointments from "./pages/guest/MyAppointments";
import BookingHistory from "./pages/guest/BookingHistory";
import Notifications from "./pages/guest/Notifications";

// Receptionist pages
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import Bookings from "./pages/receptionist/Bookings";
import CheckInOut from "./pages/receptionist/CheckInOut";
import WalkInBooking from "./pages/receptionist/WalkInBooking";
import Payments from "./pages/receptionist/Payments";
import Clients from "./pages/receptionist/Clients";

// Staff authentication
import StaffLogin from "./pages/StaffLogin";
import StaffProtectedRoute from "./components/StaffProtectedRoute";

// Spa Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerServices from "./pages/manager/ManagerServices";
import ManagerTherapists from "./pages/manager/ManagerTherapists";
import ManagerTimeOff from "./pages/manager/ManagerTimeOff";
import ManagerPaymentReports from "./pages/manager/ManagerPaymentReports";
import ManagerActivityLogs from "./pages/manager/ManagerActivityLogs";
import AppShell from "./components/manager/AppShell";

// Massage Therapist portal
import TherapistPortal from "./pages/therapist/TherapistPortal";

function App() {
  const location = useLocation();

  const isStaffPage = [
    "/receptionist",
    "/therapist",
    "/manager",
  ].some(
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
          {/* =========================
              Public Pages
          ========================= */}

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

          {/* =========================
              Staff Login
          ========================= */}

          <Route
            path="/staff/login"
            element={<StaffLogin />}
          />

          {/* =========================
              Guest Pages
          ========================= */}

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

          {/* =========================
              Receptionist Pages
          ========================= */}

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

          {/* =========================
              Spa Manager Pages
          ========================= */}
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

          {/* =========================
              Massage Therapist Pages
          ========================= */}

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
              path="/therapist/notes"
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