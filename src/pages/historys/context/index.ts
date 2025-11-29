import { useContext, createContext } from 'react';
import type { MainControllerType } from './MainControllerProvider';

export const MainControllerContext = createContext<MainControllerType | null>(null);

const useMainControllerContext = () => {
  const context = useContext(MainControllerContext);
  if (!context) {
    throw new Error('useMainControllerContext must be used within MainControllerProvider');
  }
  return context;
};
export default useMainControllerContext;