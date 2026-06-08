import { useContext } from 'react';
import { ViewModeContext } from '@/application/contexts/ViewModeContext';
import type { ViewModeContextType } from '@/application/contexts/ViewModeContext';

/**
 * 获取当前视图模型的上下文值
 *
 * 该 Hook 封装了 useContext(ViewModeContext)，方便在组件树中任意位置
 * 访问视图模型相关的状态和方法，无需直接引入 Context 对象。
 *
 * @returns {ViewModeContextType} 当前视图模式上下文的值，包含以下内容：
 *   - layoutStyle: 当前布局样式（例如 'LayoutStyle.TAB' 或 'LayoutStyle.SPH'）
 *   - setLayoutStyle: 切换布局样式的状态更新函数
 *   - elementsData: 与视图模型关联的元素数据
 *   - transformMatrices: 用于布局变换的矩阵数组
 *
 * @example
 * const { layoutStyle, setLayoutStyle } = useViewMode();
 */
export function useViewMode (): ViewModeContextType {
  return useContext(ViewModeContext);
}