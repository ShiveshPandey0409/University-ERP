import { api } from "./client";

export interface ComplaintStatus {
  opened: number;
  closed: number;
  assigned: number;
  not_assigned: number;
}
export interface Complaint {
  id: number;
  enroll_no: string | null;
  details: string | null;
  category: string | null;
  status: string | null;
  assign: string | null;
  crby: string | null;
  crat: string | null;
}
export interface Category {
  id: number;
  categ: string | null;
}
export interface DegreeDashboard {
  applied: number;
  pending: number;
  printing: number;
  delivered: number;
}
export interface DegreeRow {
  id: number;
  enroll_no: string | null;
  rollno: string | null;
  name: string | null;
  course: string | null;
  degree_type: string | null;
  division: string | null;
  status: string | null;
  verified: string | null;
  delivered: string | null;
  cert_no: string | null;
}
export interface FeesDashboard {
  today: { count: number; amount: number };
  yesterday: { count: number; amount: number };
}
export interface FeesRow {
  enroll_no: string | null;
  order_id: string;
  fee_for: string | null;
  amount: number;
  transaction_no: string | null;
  pay_date: string | null;
  student_name: string | null;
  mobile: string | null;
}

export const grievanceStatus = async () => (await api.get<ComplaintStatus>("/grievance/status")).data;
export const grievanceCategories = async () => (await api.get<Category[]>("/grievance/categories")).data;
export const grievanceComplaints = async (params: { status?: string; category?: string }) =>
  (await api.get<Complaint[]>("/grievance/complaints", { params })).data;
export const grievanceUpdate = async (id: number, body: { remarks?: string; status?: string; assign?: string }) =>
  (await api.put(`/grievance/complaints/${id}`, body)).data;

export const degreeDashboard = async () => (await api.get<DegreeDashboard>("/degree/dashboard")).data;
export const degreeList = async (params: { status?: string; search?: string }) =>
  (await api.get<DegreeRow[]>("/degree/list", { params })).data;

export const feesDashboard = async () => (await api.get<FeesDashboard>("/fees/dashboard")).data;
export const feesCollection = async (date_from: string, date_to: string) =>
  (await api.get<FeesRow[]>("/fees/collection", { params: { date_from, date_to } })).data;

export const getNotice = async () => (await api.get<{ id: number; details: string | null }>("/notices")).data;
export const updateNotice = async (details: string) => (await api.put("/notices", { details })).data;
