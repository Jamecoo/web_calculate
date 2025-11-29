import { HistoryContent } from "./components/historyContent";
import { MainControllerProvider } from "./context/MainControllerProvider";

const Content = () => {
  return <HistoryContent />;
};

export const HistorysPage = () => {
  return (
    <MainControllerProvider>
      <Content />
    </MainControllerProvider>
  );
};
