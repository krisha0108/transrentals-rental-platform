import { apiGet, apiPost } from './client';

export async function getStaffAttendance(month, year) {
  const res = await apiGet(`/vendor/staff/attendance?month=${month}&year=${year}`);
  return res?.data;
}

export async function markStaffAttendance(records) {
  const res = await apiPost('/vendor/staff/attendance', { records });
  return res?.data;
}

export async function getStaffPayroll(month, year) {
  const res = await apiGet(`/vendor/staff/payments?month=${month}&year=${year}`);
  return res?.data;
}

export async function markStaffPayment(data) {
  const res = await apiPost('/vendor/staff/payments', data);
  return res?.data;
}
