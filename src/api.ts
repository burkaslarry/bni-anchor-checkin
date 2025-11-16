export type MemberAttendance = {
  eventName: string;
  eventDate: string;
  status: string;
};

export type EventAttendance = {
  memberName: string;
  membershipId?: string;
  status: string;
};

// Kotlin backend running on port 8080
const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8080";

const jsonHeaders = {
  "Content-Type": "application/json"
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || "Attendance service returned an unexpected response."
    );
  }
  return response.json();
}

export async function recordAttendance(
  qrPayload: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/api/attendance/scan`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ qrPayload }),
    mode: "cors"
  });
  return handleResponse(response);
}

export async function searchMemberAttendance(
  name: string,
  signal?: AbortSignal
): Promise<MemberAttendance[]> {
  const response = await fetch(
    `${API_BASE}/api/attendance/member?name=${encodeURIComponent(name)}`,
    { signal, mode: "cors" }
  );
  return handleResponse(response);
}

export async function searchEventAttendance(
  date: string,
  signal?: AbortSignal
): Promise<EventAttendance[]> {
  const response = await fetch(
    `${API_BASE}/api/attendance/event?date=${encodeURIComponent(date)}`,
    { signal, mode: "cors" }
  );
  return handleResponse(response);
}

