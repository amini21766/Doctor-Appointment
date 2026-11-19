import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiUser, FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext.jsx";
import { roleHome } from "../utils/roles.js";

const links = [
  { to: "/", label: "HOME" },
  { to: "/doctors", label: "ALL DOCTORS" },
  { to: "/about", label: "ABOUT" },
  { to: "/contact", label: "CONTACT" },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accountOpen) return undefined;
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    setOpen(false);
    setAccountOpen(false);
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `relative py-5 text-sm font-medium tracking-wide transition ${
      isActive ? "text-primary" : "text-slate-600 hover:text-primary"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <nav className="container-x flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 py-3"
          aria-label="Prescripto home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
            +
          </span>
          <span className="text-xl font-semibold text-ink">Prescripto</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-8">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === "/"}>
              {({ isActive }) => (
                <span className="relative">
                  {l.label}
                  {isActive && (
                    <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 rounded bg-primary" />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/admin/login"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:border-primary hover:text-primary xl:px-5"
          >
            Admin Panel
          </Link>

          {!isAuthenticated ? (
            <Link to="/register" className="btn-primary py-2">
              Create account
            </Link>
          ) : (
            <div ref={accountRef} className="group relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex min-h-10 items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-primary"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <FiUser />
                )}
                <span className="max-w-[120px] truncate">{user.name}</span>
              </button>
              <div
                className={`absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition ${
                  accountOpen ? "visible opacity-100" : "invisible opacity-0"
                } group-hover:visible group-hover:opacity-100`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    navigate(roleHome(user.role));
                  }}
                  className="block min-h-11 w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-11 w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut /> Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-2xl text-ink transition hover:bg-slate-50 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200 bg-white lg:hidden"
        >
          <div className="container-x flex flex-col py-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `border-b border-slate-100 py-3 text-sm font-medium ${
                    isActive ? "text-primary" : "text-slate-600"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/admin/login" onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-slate-600">
              Admin Panel
            </Link>
            {!isAuthenticated ? (
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary my-3">
                Create account
              </Link>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 py-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate(roleHome(user.role)); }}
                  className="inline-flex min-h-11 min-w-0 items-center text-sm font-medium text-primary"
                >
                  <span className="truncate">{user.name}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}