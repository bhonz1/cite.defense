// Use relative URLs for Next.js API routes (no separate backend server needed)
const API_URL = '';

export async function fetchApi(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Note: Auth is now handled via Supabase cookies automatically
  // Token parameter kept for backward compatibility but not used

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important: include cookies for auth
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Appointments
export const getAppointments = (token: string, params?: Record<string, string>) => {
  const queryString = params ? `?${new URLSearchParams(params)}` : "";
  return fetchApi(`/api/appointments${queryString}`, {}, token);
};

export const createAppointment = (token: string, data: unknown) =>
  fetchApi("/api/appointments", { method: "POST", body: JSON.stringify(data) }, token);

export const updateAppointment = (token: string, id: string, data: unknown) =>
  fetchApi(`/api/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token);

export const deleteAppointment = (token: string, id: string) =>
  fetchApi(`/api/appointments/${id}`, { method: "DELETE" }, token);

// Advisers
export const getAdvisers = (token: string) =>
  fetchApi("/api/advisers", {}, token);

// Dashboard stats
export const getDashboardStats = (token: string) =>
  fetchApi("/api/dashboard/stats", {}, token);

// Available slots
export const getAvailableSlots = (token: string, date: string, roomId?: string) =>
  fetchApi(`/api/available-slots?date=${date}${roomId ? `&roomId=${roomId}` : ''}`, {}, token);
