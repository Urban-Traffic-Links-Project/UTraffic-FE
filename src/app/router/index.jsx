import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "../layout/AdminLayout";
import { MainLayout } from "../layout/MainLayout";
import { PATHS } from "./paths";

import { AccountManagementPage } from "../../features/admin/pages/AccountManagementPage";
import { CorrelationAnalysisPage } from "../../features/analysis/pages/CorrelationAnalysisPage";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { HomePage } from "../../features/home/pages/HomePage";
import { PredictCongestionPage } from "../../features/predict/pages/PredictCongestionPage";
import { TrafficDataPage } from "../../features/trafficData/pages/TrafficDataPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path={PATHS.home} element={<HomePage />} />
        <Route path={PATHS.trafficData} element={<TrafficDataPage />} />
        <Route path={PATHS.analysis} element={<CorrelationAnalysisPage />} />
        <Route path={PATHS.predict} element={<PredictCongestionPage />} />
        <Route path={PATHS.login} element={<LoginPage />} />
        <Route path={PATHS.signup} element={<RegisterPage />} />
      </Route>
      <Route path={PATHS.admin} element={<AdminLayout />}>
        <Route index element={<Navigate to={PATHS.admin + "/accounts"} replace />} />
        <Route path="accounts" element={<AccountManagementPage />} />
        <Route path="settings" element={<div>Trang cài đặt hệ thống</div>} />
      </Route>

    </Routes>
  );
}