import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../layout/MainLayout";
import { PATHS } from "./paths";

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

      <Route path="*" element={<Navigate to={PATHS.home} replace />} />
    </Routes>
  );
}