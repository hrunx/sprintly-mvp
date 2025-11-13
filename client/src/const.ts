export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "https://api.dicebear.com/7.x/shapes/svg?seed=Sprintly&backgroundColor=4f46e5,7c3aed";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  return "/login";
};
