import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiGrid, FiUserCheck, FiUsers, FiCalendar, FiTag, FiSettings, FiLogOut, FiMenu, FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext.jsx";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FiGrid },
  { to: "/admin/doctors", label: "Doctors", icon: FiUserCheck },
  { to: "/admin/patients", label: "Patients", icon: FiUsers },
  { to: "/admin/appointments", label: "Appointments", icon: FiCalendar },
  { to: "/admin/specialties", label: "Specialties", icon: FiTag },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/admin/login");
  };

  const NavItems = () => (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
              isActive ? "bg-primary-light font-medium text-primary" : "text-slate-600 hover:bg-slate-50"
            }`
          }
        >
          <Icon /> {label}
        </NavLink>
      ))}
      <button
        type="button"
        className="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-400"
        disabled
      >
        <FiSettings /> Settings
      </button>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-600 hover:bg-red-50"
      >
        <FiLogOut /> Logout
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">+</span>
          <span className="text-lg font-semibold text-ink">Admin Panel</span>
        </div>
        <NavItems />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 lg:px-8">
          <button
            type="button"
            className="text-2xl text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle admin menu"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
          <h1 className="text-base font-semibold text-ink">Admin Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">{user?.name}</span>
            {user?.profileImage && (
              <img src={user.profileImage} alt="" className="h-8 w-8 rounded-full object-cover" />
            )}
          </div>
        </header>

        {open && (
          <div className="border-b border-slate-200 bg-white p-4 lg:hidden">
            <NavItems />
          </div>
        )}

        <main className="flex-1 p-5 lg:p-8">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}