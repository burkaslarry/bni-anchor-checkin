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
  const response = await fetch("/api/attendance/scan", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ qrPayload })
  });
  return handleResponse(response);
}

export async function searchMemberAttendance(
  name: string,
  signal?: AbortSignal
): Promise<MemberAttendance[]> {
  const response = await fetch(
    `/api/attendance/member?name=${encodeURIComponent(name)}`,
    { signal }
  );
  return handleResponse(response);
}

export async function searchEventAttendance(
  date: string,
  signal?: AbortSignal
): Promise<EventAttendance[]> {
  const response = await fetch(
    `/api/attendance/event?date=${encodeURIComponent(date)}`,
    { signal }
  );
  return handleResponse(response);
}

