import { Routes, Route, Navigate } from "react-router-dom";
import { HOME_PATH, REPORT_PATH, COST_REPORT_PATH, BALANCES_PATH, LOGIN_PATH, PROFILE_PATH } from "./path";
import { HomePage } from "../pages/home";
import { HistorysPage } from "../pages/historys";
import { CostReportPage } from "../pages/cost-report";
import { BalancesPage } from "../pages/balances";
import { ProfilePage } from "../pages/profile";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={HOME_PATH} replace />} />
      {/* Auth gating happens in App; if an authed user hits /login send them home */}
      <Route path={LOGIN_PATH} element={<Navigate to={HOME_PATH} replace />} />

      <Route path={HOME_PATH} element={<HomePage />} />
      {/* <Route path={USER_PATH} element={<User />} /> */}
      <Route path={REPORT_PATH} element={<HistorysPage />} />
      <Route path={COST_REPORT_PATH} element={<CostReportPage />} />
      <Route path={BALANCES_PATH} element={<BalancesPage />} />
      <Route path={PROFILE_PATH} element={<ProfilePage />} />

      {/* 404 Not Found */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
};

export default AppRouter;
