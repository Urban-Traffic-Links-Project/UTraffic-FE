import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../layout/AdminLayout";
import { MainLayout } from "../layout/MainLayout";
import { PATHS } from "./paths";

import { AccountManagementPage } from "../../features/admin/pages/AccountManagementPage";
import { CorrelationAnalysisPage } from "../../features/analysis/pages/CorrelationAnalysisPage";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { TrafficDashboardPage } from "../../features/dashboard/pages/TrafficDashboardPage";
import { HomePage } from "../../features/home/pages/HomePage";
import { PredictCongestionPage } from "../../features/predict/pages/PredictCongestionPage";
import { TrafficDataPage } from "../../features/trafficData/pages/TrafficDataPage";
import { AdminRoute } from "./AdminRoute";

import { ProtectedRoute } from "./ProtectedRoute";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={PATHS.home} element={<HomePage />} />

        <Route
          path={PATHS.trafficData}
          element={
            <ProtectedRoute>
              <TrafficDataPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={PATHS.dashboard}
          element={
            <ProtectedRoute>
              <TrafficDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={PATHS.analysis}
          element={
            <ProtectedRoute>
              <CorrelationAnalysisPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={PATHS.predict}
          element={
            <ProtectedRoute>
              <PredictCongestionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path={PATHS.incidents}
          element={<Navigate to={PATHS.predict} replace />}
        />


        <Route path={PATHS.login} element={<LoginPage />} />
        <Route path={PATHS.signup} element={<RegisterPage />} />
      </Route>
      <Route
        path={PATHS.admin}
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to={PATHS.admin + "/accounts"} replace />} />
        <Route path="accounts" element={<AccountManagementPage />} />
        <Route path="settings" element={<div>Trang cài đặt hệ thống</div>} />
      </Route>

    </Routes>
  );
}