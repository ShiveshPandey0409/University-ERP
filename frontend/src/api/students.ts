import { api } from "./client";

export interface StudentListItem {
  enroll_no: string;
  name: string | null;
  father_name: string | null;
  category: string | null;
  gender: string | null;
  mobile: string | null;
  email: string | null;
}

export interface EnrollmentOut {
  session: string | null;
  course_id: string | null;
  course_name: string | null;
  semester: string | null;
  roll_no: string | null;
  student_type: string | null;
  status: string | null;
  form_status: string | null;
}

export interface StudentProfile {
  enroll_no: string;
  name: string | null;
  name_hindi: string | null;
  father_name: string | null;
  mother_name: string | null;
  gender: string | null;
  dob: string | null;
  category: string | null;
  ews: string | null;
  mobile: string | null;
  email: string | null;
  address1: string | null;
  city1: string | null;
  state1: string | null;
  photo_url: string | null;
  sign_url: string | null;
  prof_status: string | null;
  enrollments: EnrollmentOut[];
}

export async function listStudents(search: string, limit = 50, offset = 0): Promise<StudentListItem[]> {
  const { data } = await api.get<StudentListItem[]>("/students", {
    params: { search: search || undefined, limit, offset },
  });
  return data;
}

export async function getStudent(enroll: string): Promise<StudentProfile> {
  const { data } = await api.get<StudentProfile>(`/students/${encodeURIComponent(enroll)}`);
  return data;
}
