import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  );
}