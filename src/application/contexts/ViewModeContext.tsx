import { createContext } from 'react';
import { LayoutStyle } from '@/domain/typings/viewModels';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import type { ViewModeContextType } from '@/application/typings/ViewModeContext';

/**
 * 视图模式上下文，提供布局模式、元素数据和变换矩阵数组数据
 */
export const ViewModeContext = createContext<ViewModeContextType>({
  layoutStyle: LayoutStyle.RAN,
  updateLayout: () => {},
  elementsData: null,
  cardsMatrix3d: null,
  cardsWrapMatrix3d: null,
  setCardsWrapMatrix3d: () => MatrixTools.identityMatrix()
})