import TherapistPortal from "./pages/therapist/TherapistPortal";
import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Topbar from "./components/Topbar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";

import About from "./pages/About";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Pricing from "./pages/Pricing";
import Appointment from "./pages/Appointment";
import Opening from "./pages/Opening";
import Team from "./pages/Team";
import Testimonial from "./pages/Testimonial";
import Contact from "./pages/Contact";

import GuestDashboard from "./pages/guest/GuestDashboard";
import MyAppointments from "./pages/guest/MyAppointments";
import BookingHistory from "./pages/guest/BookingHistory";
import Notifications from "./pages/guest/Notifications";

import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import Bookings from "./pages/receptionist/Bookings";
import CheckInOut from "./pages/receptionist/CheckInOut";
import WalkInBooking from "./pages/receptionist/WalkInBooking";
import Payments from "./pages/receptionist/Payments";
import Clients from "./pages/receptionist/Clients";

function App() {
  const location = useLocation();

  const isStaffPage = ["/receptionist", "/therapist", "/manager"].some(prefix => location.pathname === prefix || location.pathname.startsWith(prefix + "/"));

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
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/appointment"
            element={<Appointment />}
          />
          <Route path="/opening" element={<Opening />} />
          <Route path="/team" element={<Team />} />
          <Route
            path="/testimonial"
            element={<Testimonial />}
          />
          <Route path="/contact" element={<Contact />} />

          {/* Guest Pages */}
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

          {/* Receptionist Pages */}
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

                  {/* Massage Therapist Routes */}
          <Route path="/therapist/dashboard" element={<TherapistPortal />} />
          <Route path="/therapist/schedule" element={<TherapistPortal />} />
          <Route path="/therapist/appointments" element={<TherapistPortal />} />
          <Route path="/therapist/notes" element={<TherapistPortal />} />
          <Route path="/therapist/availability" element={<TherapistPortal />} />
                  <Route path="/therapist/profile" element={<TherapistPortal />} />
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
