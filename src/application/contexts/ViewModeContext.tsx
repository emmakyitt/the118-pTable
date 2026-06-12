import { createContext } from 'react';
import { LayoutStyle } from '@/domain/typings/viewModels';
import type { ViewModeContextType } from '@/application/typings/ViewModeContext';

/**
 * 视图模式上下文，提供布局模式、元素数据和变换矩阵数组数据
 */
export const ViewModeContext = createContext<ViewModeContextType>({
  layoutStyle: LayoutStyle.RAN,
  setLayoutStyle: () => {},
  elementsData: null,
  cardsMatrix3d: null
})