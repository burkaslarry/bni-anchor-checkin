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

export type CheckInRecord = {
  name: string;
  type: string;
  timestamp: string;
  receivedAt: string;
};

export type CheckInRequest = {
  name: string;
  type: string;
  currentTime: string;
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

// Get list of members
export async function getMembers(): Promise<{ members: string[] }> {
  const response = await fetch(`${API_BASE}/api/members`, { mode: "cors" });
  return handleResponse(response);
}

// Check-in (manual entry)
export async function checkIn(
  request: CheckInRequest
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/api/checkin`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(request),
    mode: "cors"
  });
  return handleResponse(response);
}

// Get all check-in records
export async function getRecords(): Promise<{ records: CheckInRecord[] }> {
  const response = await fetch(`${API_BASE}/api/records`, { mode: "cors" });
  return handleResponse(response);
}

// Clear all records
export async function clearRecords(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/api/records`, {
    method: "DELETE",
    mode: "cors"
  });
  return handleResponse(response);
}

// Delete a specific record by index
export async function deleteRecord(index: number): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/api/records/${index}`, {
    method: "DELETE",
    mode: "cors"
  });
  return handleResponse(response);
}

// Export records as CSV (returns blob URL)
export async function exportRecords(): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/export`, { mode: "cors" });
  if (!response.ok) {
    throw new Error("Failed to export records");
  }
  return response.blob();
}

// Create event
export async function createEvent(
  name: string,
  date: string
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/api/events`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ name, date }),
    mode: "cors"
  });
  return handleResponse(response);
}

