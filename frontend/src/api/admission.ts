import { api } from "./client";

export interface AdmDashboard {
  received: number;
  verified: number;
  pending: number;
  admitted: number;
}
export interface AdmForm {
  reg_no: string;
  student_name: string | null;
  fname: string | null;
  gender: string | null;
  category: string | null;
  course_name: string | null;
  major: string | null;
  merit_cgpa: number | null;
  pmt_status: string | null;
  verify: string | null;
  admitted: string | null;
  rank?: number;
}
export interface CatGender {
  category: string;
  male: number;
  female: number;
  total: number;
}

export const admDashboard = async () => (await api.get<AdmDashboard>("/admission/dashboard")).data;
export const admForms = async (params: { status?: string }) =>
  (await api.get<AdmForm[]>("/admission/forms", { params })).data;
export const admMerit = async () => (await api.get<AdmForm[]>("/admission/merit")).data;
export const admReport = async () => (await api.get<CatGender[]>("/admission/report/category-gender")).data;
export const admVerify = async (reg: string) => (await api.post(`/admission/forms/${reg}/verify`)).data;
