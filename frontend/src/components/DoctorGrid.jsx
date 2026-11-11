import DoctorCard from "./DoctorCard.jsx";
import { DoctorGridSkeleton } from "./Skeleton.jsx";
import EmptyState from "./EmptyState.jsx";

export default function DoctorGrid({ doctors = [], loading = false, showFee = false, emptyMessage }) {
  if (loading) return <DoctorGridSkeleton count={8} />;

  if (!doctors.length) {
    return (
      <EmptyState
        icon="🩺"
        title="No doctors found"
        message={emptyMessage || "Try adjusting your search or filters to find a doctor."}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {doctors.map((doctor) => (
        <DoctorCard key={doctor._id} doctor={doctor} showFee={showFee} />
      ))}
    </div>
  );
}