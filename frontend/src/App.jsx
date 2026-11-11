import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Loading from "./components/Loading.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import AdminLayout from "./components/AdminLayout.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Doctors = lazy(() => import("./pages/Doctors.jsx"));
const DoctorDetails = lazy(() => import("./pages/DoctorDetails.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const MyAppointments = lazy(() => import("./pages/MyAppointments.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const DoctorDashboard = lazy(() => import("./pages/doctor/DoctorDashboard.jsx"));
const DoctorProfile = lazy(() => import("./pages/doctor/DoctorProfile.jsx"));
const DoctorAppointments = lazy(() => import("./pages/doctor/DoctorAppointments.jsx"));
const DoctorAvailability = lazy(() => import("./pages/doctor/DoctorAvailability.jsx"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminDoctors = lazy(() => import("./pages/admin/AdminDoctors.jsx"));
const AddDoctor = lazy(() => import("./pages/admin/AddDoctor.jsx"));
const AdminPatients = lazy(() => import("./pages/admin/AdminPatients.jsx"));
const AdminAppointments = lazy(() => import("./pages/admin/AdminAppointments.jsx"));
const AdminSpecialties = lazy(() => import("./pages/admin/AdminSpecialties.jsx"));

const PublicLayout = ({ children }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<Loading label="Loading..." />}>
      <Routes>
        {/* ---------- Public ---------- */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/doctors" element={<PublicLayout><Doctors /></PublicLayout>} />
        <Route path="/doctors/:specialty" element={<PublicLayout><Doctors /></PublicLayout>} />
        <Route path="/doctor/:id" element={<PublicLayout><DoctorDetails /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
        <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
        <Route path="/reset-password/:token" element={<PublicLayout><ResetPassword /></PublicLayout>} />

        {/* ---------- Patient ---------- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={["patient"]} />}>
            <Route path="/profile" element={<PublicLayout><Profile /></PublicLayout>} />
            <Route path="/my-appointments" element={<PublicLayout><MyAppointments /></PublicLayout>} />
          </Route>
        </Route>

        {/* ---------- Doctor ---------- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={["doctor"]} />}>
            <Route path="/doctor-dashboard" element={<PublicLayout><DoctorDashboard /></PublicLayout>} />
            <Route path="/doctor-profile" element={<PublicLayout><DoctorProfile /></PublicLayout>} />
            <Route path="/doctor-appointments" element={<PublicLayout><DoctorAppointments /></PublicLayout>} />
            <Route path="/doctor-availability" element={<PublicLayout><DoctorAvailability /></PublicLayout>} />
          </Route>
        </Route>

        {/* ---------- Admin ---------- */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/doctors" element={<AdminLayout><AdminDoctors /></AdminLayout>} />
            <Route path="/admin/add-doctor" element={<AdminLayout><AddDoctor /></AdminLayout>} />
            <Route path="/admin/patients" element={<AdminLayout><AdminPatients /></AdminLayout>} />
            <Route path="/admin/appointments" element={<AdminLayout><AdminAppointments /></AdminLayout>} />
            <Route path="/admin/specialties" element={<AdminLayout><AdminSpecialties /></AdminLayout>} />
          </Route>
        </Route>

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
      </Routes>
    </Suspense>
  );
}
