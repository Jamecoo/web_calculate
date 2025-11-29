import { Routes, Route, Navigate } from "react-router-dom";
import { HOME_PATH, REPORT_PATH } from "./path";
import { HomePage } from "../pages/home";
import { HistorysPage } from "../pages/historys";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={HOME_PATH} replace />} />

      <Route path={HOME_PATH} element={<HomePage />} />
      {/* <Route path={USER_PATH} element={<User />} /> */}
      <Route path={REPORT_PATH} element={<HistorysPage />} />

      {/* 404 Not Found */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
};

export default AppRouter;
