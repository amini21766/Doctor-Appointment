import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-white">
      <div className="container-x grid gap-10 py-14 md:grid-cols-3">
        {/* Brand + description */}
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
              +
            </span>
            <span className="text-xl font-semibold text-ink">Prescripto</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            A modern platform to discover trusted doctors and book appointments
            online — quickly, securely and without the waiting room.
          </p>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/about" className="hover:text-primary">About us</Link></li>
            <li><Link to="/doctors" className="hover:text-primary">All Doctors</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Privacy policy</Link></li>
          </ul>
        </div>

        {/* Get in touch */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink">Get in touch</h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            <li>Phone: +1 (555) 010-2030</li>
            <li>Email: support@prescripto.test</li>
            <li>Address: 123 Health Street, Medical City</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-slate-400 sm:flex-row">
          <p>Copyright © {new Date().getFullYear()} Prescripto. All rights reserved.</p>
          <p>Built with the MERN stack</p>
        </div>
      </div>
    </footer>
  );
}