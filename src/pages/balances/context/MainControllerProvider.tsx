import { MainControllerContext } from '.';
import type { ReactNode } from 'react';
import useBalancesController from '../controllers';

export type MainControllerType = ReturnType<typeof useBalancesController>;

export const MainControllerProvider = ({ children }: { children: ReactNode }) => {
  const controller = useBalancesController();

  return <MainControllerContext.Provider value={controller}>{children}</MainControllerContext.Provider>;
};
