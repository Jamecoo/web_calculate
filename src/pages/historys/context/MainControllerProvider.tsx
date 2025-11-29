import { MainControllerContext } from '.';
import type { ReactNode } from 'react';
import useMainController from '../controllers';

export type MainControllerType = ReturnType<typeof useMainController>;

export const MainControllerProvider = ({ children }: { children: ReactNode }) => {
  const controller = useMainController();

  return <MainControllerContext.Provider value={controller}>{children}</MainControllerContext.Provider>;
};
