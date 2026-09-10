export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "https://buidmelkv2-production.up.railway.app/api"
    : "http://localhost:8000/api")
).replace(/\/$/, "");

export const BACKEND_ROOT_URL = API_BASE_URL.replace(/\/api$/, "");
