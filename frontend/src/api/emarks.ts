import { api } from "./client";

export interface EntryStatus {
  course_id: string | null;
  course_name: string | null;
  semester: string | null;
  students: number;
  theory: number;
  practical: number;
  internal: number;
  total: number;
}

export interface PaperItem {
  paper_code: string | null;
  paper_type: string | null;
  paper_name: string | null;
  mm: string | null;
  pm: string | null;
  total: number;
  entered: number;
}

export async function entryStatus(courseId: string, semester: string): Promise<EntryStatus[]> {
  const { data } = await api.get<EntryStatus[]>("/emarks/entry-status", {
    params: { course_id: courseId || undefined, semester: semester || undefined },
  });
  return data;
}

export async function paperList(courseId: string, semester: string): Promise<PaperItem[]> {
  const { data } = await api.get<PaperItem[]>("/emarks/papers", {
    params: { course_id: courseId, semester },
  });
  return data;
}
