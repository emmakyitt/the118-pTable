import { createContext } from 'react';
import { LayoutStyle } from '@/domain/typings/viewModels';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import type { ViewModeContextType } from '@/application/typings/ViewModeContext';

/**
 * 创建视图模式上下文（ViewModeContext）对象
 * 该上下文用于在组件树中跨层级共享视图布局、卡片数据、选中状态及 3D 变换矩阵
 * 
 * 默认值（仅在组件未包裹 ViewModeProvider 时作为后备值使用）：
 * - layoutStyle: 使用 LayoutStyle.TAB 作为默认布局
 * - elementsData: 初始为空数组，表示无卡片数据
 * - sectedElement: 0 表示无选中元素
 * - cardsMatrix3d: 空数组，表示尚未为卡片计算变换矩阵
 * - cardsWrapMatrix3d: 单位矩阵（无任何变换），表示容器处于初始状态
 * - 所有更新函数均为空实现（() => {}），在未提供 Provider 时调用不会产生任何效果
 */
export const ViewModeContext = createContext<ViewModeContextType>({
  layoutStyle: LayoutStyle.TAB,
  elementsData: [],
  sectedElement: 0,
  cardsMatrix3d: [],
  cardsWrapMatrix3d: MatrixTools.identityMatrix(),
  updateLayout: () => {},
  setSectedElement: () => {},
  setCardsMatrix3d: () => {},
  setCardsWrapMatrix3d: () => {}
})