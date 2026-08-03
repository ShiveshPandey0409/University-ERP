import { api } from "./client";

export interface MarksheetPaper {
  code: string | null;
  name: string | null;
  type: string | null;
  max: string | null;
  theory: string | null;
  practical: string | null;
  internal: string | null;
  total: string | null;
  status: string | null;
  grade: string | null;
  credit: string | null;
  point: string | null;
}

export interface Marksheet {
  rollno: string | null;
  enroll_no: string | null;
  name: string | null;
  father_name: string | null;
  course_id: string | null;
  course_name: string | null;
  semester: string | null;
  college_name: string | null;
  category: string | null;
  exam_month: string | null;
  marksheet_no: string | null;
  papers: MarksheetPaper[];
  sgpa: string | null;
  result: string | null;
  grand_cgpa: string | null;
  grand_percent: string | null;
  grand_division: string | null;
  grand_result: string | null;
  total: string | null;
  max: string | null;
}

export async function getMarksheets(rollno: string): Promise<Marksheet[]> {
  const { data } = await api.get<Marksheet[]>(`/results/${encodeURIComponent(rollno)}`);
  return data;
}

export async function myResult(): Promise<Marksheet[]> {
  const { data } = await api.get<Marksheet[]>("/student/result");
  return data;
}

export async function openMarksheetPdf(rollno: string): Promise<void> {
  const resp = await api.get(`/results/${encodeURIComponent(rollno)}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(resp.data as Blob);
  window.open(url, "_blank");
}
