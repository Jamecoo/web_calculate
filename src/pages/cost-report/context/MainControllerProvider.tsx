import { MainControllerContext } from '.';
import type { ReactNode } from 'react';
import useCostReportController from '../controllers';

export type MainControllerType = ReturnType<typeof useCostReportController>;

export const MainControllerProvider = ({ children }: { children: ReactNode }) => {
  const controller = useCostReportController();

  return <MainControllerContext.Provider value={controller}>{children}</MainControllerContext.Provider>;
};
