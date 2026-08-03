import { QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import DashboardPage from "../features/dashboard/DashboardPage";
import LoginPage from "../features/auth/LoginPage";
import AdmissionPage from "../features/admission/AdmissionPage";
import DegreePage from "../features/degree/DegreePage";
import EmarksPage from "../features/emarks/EmarksPage";
import FeesReportPage from "../features/fees/FeesReportPage";
import GrievancePage from "../features/grievance/GrievancePage";
import NoticesPage from "../features/notices/NoticesPage";
import ResultPage from "../features/results/ResultPage";
import MyExamFormsPage from "../features/student/MyExamFormsPage";
import MyResultPage from "../features/student/MyResultPage";
import MyPaymentsPage from "../features/student/MyPaymentsPage";
import MyProfilePage from "../features/student/MyProfilePage";
import StudentProfilePage from "../features/students/StudentProfilePage";
import StudentsListPage from "../features/students/StudentsListPage";
import AppShell from "../layout/AppShell";
import { AuthProvider } from "./AuthContext";
import { queryClient } from "./queryClient";
import { ColorModeProvider } from "./ThemeModeContext";

export default function App() {
  return (
    <ColorModeProvider>
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={2800}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/students" element={<StudentsListPage />} />
                  <Route path="/students/:enroll" element={<StudentProfilePage />} />
                  {/* Student self-service */}
                  <Route path="/me/profile" element={<MyProfilePage />} />
                  <Route path="/me/exam-forms" element={<MyExamFormsPage />} />
                  <Route path="/me/payments" element={<MyPaymentsPage />} />
                  <Route path="/me/result" element={<MyResultPage />} />
                  {/* Exam / marks / results */}
                  <Route path="/emarks" element={<EmarksPage />} />
                  <Route path="/results" element={<ResultPage />} />
                  {/* Back-office */}
                  <Route path="/grievance" element={<GrievancePage />} />
                  <Route path="/fees" element={<FeesReportPage />} />
                  <Route path="/degree" element={<DegreePage />} />
                  <Route path="/notices" element={<NoticesPage />} />
                  <Route path="/admission" element={<AdmissionPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        </QueryClientProvider>
      </SnackbarProvider>
    </ColorModeProvider>
  );
}
