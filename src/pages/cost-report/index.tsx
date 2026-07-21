import { MainControllerProvider } from "./context/MainControllerProvider";
import { CostReportContent } from "./components/CostReportContent";

export const CostReportPage = () => {
  return (
    <MainControllerProvider>
      <CostReportContent />
    </MainControllerProvider>
  );
};
