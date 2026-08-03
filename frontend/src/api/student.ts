import { api } from "./client";
import type { StudentProfile } from "./students";

export interface PaymentOut {
  token: string;
  fee_for: string | null;
  fee: string | null;
  late_fee: string | null;
  portal_fee: string | null;
  discount: string | null;
  fee_total: string | null;
  total_amt: string | null;
  transaction_no: string | null;
  status: string | null;
  payment_date: string | null;
  created: string | null;
}

export interface EnrollmentDetail {
  pk: number;
  session: string | null;
  course_id: string | null;
  course_name: string | null;
  semester: string | null;
  roll_no: string | null;
  status: string | null;
  acd_fee: string | null;
  exam_form: string | null;
  form_status: string | null;
}

export async function myProfile(): Promise<StudentProfile> {
  const { data } = await api.get<StudentProfile>("/student/me");
  return data;
}

export async function myPayments(): Promise<PaymentOut[]> {
  const { data } = await api.get<PaymentOut[]>("/student/payments");
  return data;
}

export async function myExamForms(): Promise<EnrollmentDetail[]> {
  const { data } = await api.get<EnrollmentDetail[]>("/student/exam-forms");
  return data;
}

export async function changePassword(old_password: string, new_password: string): Promise<void> {
  await api.post("/student/change-password", { old_password, new_password });
}
