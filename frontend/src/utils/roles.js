export const roleHome = (role) => {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "doctor":
      return "/doctor-dashboard";
    default:
      return "/";
  }
};

export const roleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "doctor":
      return "Doctor";
    default:
      return "Patient";
  }
};

export default { roleHome, roleLabel };