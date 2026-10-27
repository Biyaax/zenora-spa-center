// Frontend adapter for EXISTING Zenora manager routes. No new endpoints are invented.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const token = () => sessionStorage.getItem('zenoraStaffToken');
export async function managerRequest(path, options = {}) {
  const headers = { ...options.headers, Authorization: `Bearer ${token() || ''}` };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status}).`);
  return data;
}
export const getManager = (path) => managerRequest('/api/manager' + path);
export const writeManager = (path, method, payload) => managerRequest('/api/manager' + path, { method, body: JSON.stringify(payload) });
export const dateText = (date) => {
  if (!date) return 'Not available';
  const s = String(date);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(s.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', year:'numeric' }).format(d);
};
export const dateTimeText = (date) => {
  if (!date) return 'Not available';
  const d = new Date(String(date).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit', hour12:true }).format(d);
};
export const timeText = (time) => {
  if (!time) return 'Not set';
  const m = String(time).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 'Not set';
  let h = Number(m[1]); return `${h%12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
};
export const peso = (value) => new Intl.NumberFormat('en-PH', { style:'currency',currency:'PHP',minimumFractionDigits:2,maximumFractionDigits:2 }).format(Number(value)||0);
export const titleCase = (value) => String(value || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
export const personName = (r) => [r?.first_name, r?.last_name].filter(Boolean).join(' ') || r?.name || 'Name unavailable';
export const isActive = (v) => v===true || v===1 || v==='1';
export const localYMD = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
