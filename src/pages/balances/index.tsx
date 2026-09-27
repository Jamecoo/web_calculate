import { MainControllerProvider } from "./context/MainControllerProvider";
import { BalancesContent } from "./components/BalancesContent";

export const BalancesPage = () => {
  return (
    <MainControllerProvider>
      <BalancesContent />
    </MainControllerProvider>
  );
};
