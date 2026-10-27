// Frontend fixtures only. Replace with therapist-scoped API responses.
export function localDate(offset = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateFromLocal(iso) { return new Date(`${iso}T12:00:00`); }
export function formatDate(iso) {
  return dateFromLocal(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function formatTime(hhmm) {
  return new Date(`2000-01-01T${hhmm}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
export function shiftDay(iso, offset) {
  const d = dateFromLocal(iso); d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function weekDays(iso) {
  const d = dateFromLocal(iso);
  const monday = shiftDay(iso, -((d.getDay() + 6) % 7));
  return Array.from({length: 7}, (_, i) => shiftDay(monday, i));
}
export function dateTimeMs(appointment) {
  return new Date(`${appointment.date}T${appointment.time}:00`).getTime();
}
export const STATUSES = ["All", "Confirmed", "Checked In", "Ongoing", "Completed", "No-Show"];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function weekdayForDate(date) {
  return WEEKDAYS[(dateFromLocal(date).getDay() + 6) % 7];
}
export const demoStaff = {
  name: "Maria Santos", role: "Massage Therapist",
  specialties: ["Swedish Massage", "Hot Stone Therapy", "Aromatherapy"],
  email: "maria.santos@example.com", phone: "0917 000 0042"
};
const prefilledNotes = {
  areas: "Back and shoulders", pressure: "Medium",
  observations: "Client reported stiffness around the upper back; pressure was adjusted for comfort.",
  recommendations: "Gentle stretches and adequate hydration."
};
export function createAppointments() {
  return [
    { id:"APT-1001", date:localDate(), time:"09:00", duration:60, client:"Bea Mendoza", phone:"0917 000 0001", service:"Swedish Massage", specialRequest:"Prefers light pressure", allergies:"Sensitive to strongly scented oils", status:"Confirmed", notes:null, startedAt:null },
    { id:"APT-1002", date:localDate(), time:"11:00", duration:60, client:"Angel Cruz", phone:"0917 000 0002", service:"Aromatherapy", specialRequest:"Avoid lavender", allergies:"Lavender", status:"Ongoing", notes:null, startedAt: new Date(Date.now() - 18*60000).toISOString() },
    { id:"APT-1003", date:localDate(), time:"14:00", duration:75, client:"Carla Gomez", phone:"0917 000 0003", service:"Hot Stone Therapy", specialRequest:"Avoid right shoulder", allergies:"None reported", status:"Checked In", notes:null, startedAt:null },
    { id:"APT-1004", date:localDate(), time:"16:00", duration:45, client:"Ella Ramos", phone:"0917 000 0004", service:"Foot Massage", specialRequest:"Extra attention to the arches", status:"Confirmed", notes:null, startedAt:null },
    { id:"APT-1005", date:localDate(), time:"08:00", duration:45, client:"Nina Torres", phone:"0917 000 0005", service:"Body Massage", specialRequest:"Focus on upper back", status:"Completed", notes:prefilledNotes, startedAt: new Date(Date.now() - 90*60000).toISOString() },
    { id:"APT-1006", date:localDate(1), time:"10:00", duration:60, client:"Dan Reyes", phone:"0917 000 0006", service:"Swedish Massage", specialRequest:"Light pressure", status:"Confirmed", notes:null, startedAt:null },
    { id:"APT-1007", date:localDate(2), time:"13:30", duration:60, client:"Mia Santos", phone:"0917 000 0007", service:"Aromatherapy", specialRequest:"Citrus-scented oil", status:"Confirmed", notes:null, startedAt:null },
    { id:"APT-1008", date:localDate(-1), time:"10:00", duration:60, client:"Leo Tan", phone:"0917 000 0008", service:"Body Massage", specialRequest:"None", status:"No-Show", notes:null, startedAt:null },
    { id:"APT-1009", date:localDate(-1), time:"15:00", duration:60, client:"Ria Cruz", phone:"0917 000 0009", service:"Swedish Massage", specialRequest:"Gentle pressure", status:"Completed", notes:prefilledNotes, startedAt:null },
    { id:"APT-1010", date:localDate(4), time:"12:00", duration:60, client:"Lara Lim", phone:"0917 000 0010", service:"Hot Stone Therapy", specialRequest:"First spa visit", status:"Confirmed", notes:null, startedAt:null }
  ];
}
export function createAvailability() {
  return Object.fromEntries(WEEKDAYS.map(day => [day, {
    enabled: !["Sat", "Sun"].includes(day), start:"09:00", end:"18:00"
  }]));
}
export function createTimeOff() {
  return [
    {id:"TO-1", date:localDate(3), reason:"Personal appointment", status:"Approved"},
    {id:"TO-2", date:localDate(5), reason:"Family commitment", status:"Pending"},
    {id:"TO-3", date:localDate(-3), reason:"Previous personal request", status:"Rejected"}
  ];
}
export function createNotifications() {
  return [
    {id:"N-1", label:"New assignment", text:"APT-1007 was assigned to your upcoming schedule.", when:"Today", icon:"far fa-calendar-plus"},
    {id:"N-2", label:"Cancellation", text:"A guest cancelled a previously scheduled appointment.", when:"Today", icon:"far fa-calendar-times"},
    {id:"N-3", label:"Time-off approved", text:"Your request for the upcoming day off was approved.", when:"Yesterday", icon:"fas fa-check-circle"},
    {id:"N-4", label:"Time-off rejected", text:"A past request was rejected. Review the reason with your manager.", when:"Earlier", icon:"fas fa-info-circle"}
  ];
}
export function createHistory(staffName) {
  return [
    {id:"H-1", booking:"APT-1003", client:"Carla Gomez", from:"Confirmed", to:"Checked In", actor:"Receptionist", at:new Date(Date.now()-40*60000).toISOString()},
    {id:"H-2", booking:"APT-1002", client:"Angel Cruz", from:"Checked In", to:"Ongoing", actor:staffName, at:new Date(Date.now()-18*60000).toISOString()}
  ];
}
export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 3600)).padStart(2,"0")}:${String(Math.floor((total % 3600) / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`;
}
export function formatCountdown(ms) {
  if (ms <= 0) return "Scheduled time reached";
  const total = Math.ceil(ms / 60000);
  if (total >= 1440) return `In ${Math.ceil(total / 1440)} day(s)`;
  const hours = Math.floor(total / 60), mins = total % 60;
  return hours ? `In ${hours}h ${mins}m` : `In ${mins}m`;
}
