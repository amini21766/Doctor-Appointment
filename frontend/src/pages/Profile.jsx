import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiUpload } from "react-icons/fi";
import api, { getErrorMessage, resolveImageUrl } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Loading from "../components/Loading.jsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState("info");
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", profileImage: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    api.get("/users/profile")
      .then((res) => setProfile(res.data.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    try {
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((p) => ({ ...p, profileImage: data.data.url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", {
        name: profile.name,
        phone: profile.phone,
        profileImage: profile.profileImage,
      });
      updateUser(data.data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    try {
      await api.put("/users/change-password", passwords);
      toast.success("Password changed");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) return <Loading label="Loading profile..." />;

  const avatar = resolveImageUrl(profile.profileImage);

  return (
    <div className="container-x py-12">
      <h1 className="text-2xl font-bold text-ink">My Profile</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Card */}
        <div className="card flex flex-col items-center p-8 text-center">
          <div className="h-28 w-28 overflow-hidden rounded-full bg-primary-light">
            {avatar ? (
              <img src={avatar} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl text-primary">
                {profile.name?.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">{profile.name}</h2>
          <p className="text-sm text-slate-500">{user?.role}</p>

          <label className="btn-outline mt-5 cursor-pointer py-2">
            <FiUpload /> Upload image
            <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
          </label>
        </div>

        {/* Tabs */}
        <div className="card p-8">
          <div className="flex gap-4 border-b border-slate-100 pb-3">
            <button type="button" onClick={() => setTab("info")}
              className={`text-sm font-medium ${tab === "info" ? "text-primary" : "text-slate-500"}`}>
              Profile information
            </button>
            <button type="button" onClick={() => setTab("password")}
              className={`text-sm font-medium ${tab === "password" ? "text-primary" : "text-slate-500"}`}>
              Change password
            </button>
          </div>

          {tab === "info" ? (
            <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" className="input bg-slate-50" value={profile.email} disabled />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" className="input" value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={changePassword} className="mt-6 max-w-md space-y-4">
              <div>
                <label className="label" htmlFor="currentPassword">Current password</label>
                <input id="currentPassword" type="password" className="input" value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="newPassword">New password</label>
                <input id="newPassword" type="password" className="input" value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirm new password</label>
                <input id="confirmPassword" type="password" className="input" value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" disabled={changingPw}>
                {changingPw ? "Updating..." : "Change password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}