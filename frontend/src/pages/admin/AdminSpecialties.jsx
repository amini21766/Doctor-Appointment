import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import api, { getErrorMessage } from "../../services/api.js";
import Loading from "../../components/Loading.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";

const emptyForm = { name: "", description: "", icon: "FaStethoscope", active: true };

export default function AdminSpecialties() {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/specialties", { params: { all: true } });
      setSpecialties(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing("new");
    setForm(emptyForm);
  };

  const openEdit = (s) => {
    setEditing(s._id);
    setForm({ name: s.name, description: s.description || "", icon: s.icon || "", active: s.active });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing === "new") {
        await api.post("/specialties", form);
        toast.success("Specialty created");
      } else {
        await api.put(`/specialties/${editing}`, form);
        toast.success("Specialty updated");
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    try {
      const { data } = await api.delete(`/specialties/${s._id}`);
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">Manage Specialties</h2>
        <button type="button" onClick={openAdd} className="btn-primary py-2"><FiPlus /> Add Specialty</button>
      </div>

      {loading ? (
        <Loading label="Loading specialties..." />
      ) : specialties.length === 0 ? (
        <div className="mt-5"><EmptyState icon="🏷️" title="No specialties found" /></div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specialties.map((s) => (
            <div key={s._id} className="card p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-ink">{s.name}</h3>
                <span className={`badge ${s.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                  {s.active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{s.description || "No description"}</p>
              <p className="mt-2 text-xs text-slate-400">{s.doctorCount ?? 0} doctor(s)</p>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => openEdit(s)} className="btn-outline py-1.5 text-xs">
                  <FiEdit2 /> Edit
                </button>
                <button type="button" onClick={() => remove(s)} className="btn-danger py-1.5 text-xs">
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add Specialty" : "Edit Specialty"}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" rows={3} className="input" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="icon">Icon (react-icons/fa name)</label>
            <input id="icon" className="input" value={form.icon} placeholder="FaStethoscope"
              onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary"
              checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost py-2">Cancel</button>
            <button type="submit" className="btn-primary py-2" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}