// Therapist-only adapter for EXISTING authenticated Zenora Express APIs.
// No database or backend code is changed by this package.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export function currentStaff() {
  try { return JSON.parse(sessionStorage.getItem('zenoraStaffUser') || 'null'); }
  catch { return null; }
}

export async function therapistRequest(path, { method = 'GET', body, signal } = {}) {
  const token = sessionStorage.getItem('zenoraStaffToken');
  if (!token) throw new Error('Your staff session has expired. Please sign in again.');
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('Cannot reach the Zenora server. Check the backend connection.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    if (response.status === 401) throw new Error('Session expired. Please log in again.');
    throw new Error(data.message || `The request failed (${response.status}).`);
  }
  return data;
}

export const getScheduleWeek = (date, signal) => therapistRequest(
  `/api/therapist/schedule?date=${encodeURIComponent(date)}&view=weekly`, { signal }
);
export const getAppointment = (id) => therapistRequest(`/api/therapist/appointments/${encodeURIComponent(id)}`);
export const updateAppointmentStatus = (id, status) => therapistRequest(
  `/api/therapist/appointments/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }
);
export const saveServiceNotes = (id, notes) => therapistRequest(
  `/api/therapist/appointments/${encodeURIComponent(id)}/notes`, { method: 'POST', body: { notes } }
);
export const getAvailability = (signal) => therapistRequest('/api/therapist/availability', { signal });
export const getTimeOff = (signal) => therapistRequest('/api/therapist/time-off', { signal });
export const submitTimeOffRequest = ({ date, reason }) => therapistRequest(
  '/api/therapist/time-off', { method: 'POST', body: { start_date: date, end_date: date, reason } }
);
export const getStaffProfile = (signal) => therapistRequest('/api/auth/me', { signal });

export function normalizeAppointment(row) {
  // Backend stores check-in separately; never infer Check-In from 'confirmed'.
  const checkedIn = Boolean(row.check_in_at || row.checked_in_at);
  const status = String(row.status || 'pending').toLowerCase();
  const mappedStatus = status === 'confirmed' && checkedIn ? 'Checked In' : ({
    confirmed: 'Confirmed', ongoing: 'Ongoing', completed: 'Completed',
    'no-show': 'No-Show', no_show: 'No-Show', pending: 'Pending', cancelled: 'Cancelled'
  }[status] || 'Confirmed');
  return {
    id: Number(row.id), date: row.appointment_date, time: String(row.start_time || '').slice(0, 5),
    duration: Number(row.duration_minutes || 60),
    client: [row.client_first_name, row.client_last_name].filter(Boolean).join(' ') || 'Client',
    phone: row.client_phone || '', service: row.service_name || 'Service',
    specialRequest: row.special_request || '', allergies: '', status: mappedStatus,
    notes: null, startedAt: null, checkedIn,
  };
}

export function normalizeAvailability(rows) {
  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const schedule = Object.fromEntries(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => [day, {
    enabled: false, start: '09:00', end: '18:00'
  }]));
  for (const r of rows || []) {
    const day = weekdays[Number(r.day_of_week)];
    if (!day || !schedule[day]) continue;
    if (r.is_available === true || r.is_available === 1) {
      schedule[day] = { enabled: true, start: String(r.start_time).slice(0, 5), end: String(r.end_time).slice(0, 5) };
    }
  }
  return schedule;
}

export function normalizeTimeOff(r) {
  return {
    id: String(r.id), date: r.start_date, endDate: r.end_date,
    reason: r.reason || 'No reason provided',
    status: ({ pending: 'Pending', approved: 'Approved', rejected: 'Rejected', declined: 'Rejected' })[String(r.status).toLowerCase()] || 'Pending',
  };
}

export function serializeServiceNotes(notes) {
  // Existing backend accepts one notes string (max 2000 chars).
  const text = [`Areas worked: ${notes.areas}`, `Pressure used: ${notes.pressure}`,
    `Observations: ${notes.observations}`, `Recommendations: ${notes.recommendations}`].join('\n');
  if (text.length > 2000) throw new Error('Service notes exceed the 2,000-character server limit. Shorten the observations or recommendations.');
  return text;
}
