import { useEffect, type ReactElement, type ReactNode } from 'react';
import { ElementService } from '@/domain/services/ElementService';
import { useLayoutStyle } from '@/application/hooks/useLayoutStyle';
import { ViewModeContext } from '@/application/contexts/ViewModeContext';
import { useCardsMatrix3d } from '@/application/hooks/useCardsMatrix3d';
import { useCardsWrapMatrix3d } from '@/application/hooks/useCardsWrapMatrix3d';
import { ViewModelService } from '@/domain/services/ViewModelService';
import { LayoutStyle } from '@/domain/typings/viewModels';

/**
 * 视图模式上下文提供者组件
 * 
 * 该组件负责：
 * 1. 获取所有元素数据（来自 ElementService）
 * 2. 管理布局样式状态（通过 useLayoutStyle）
 * 3. 管理卡片矩阵状态（通过 useCardsMatrix3d 和 useCardsWrapMatrix3d）
 * 4. 提供更新布局的函数（updateLayout），该函数会同步更新布局样式和两个矩阵状态
 * 5. 在组件挂载时，将布局样式初始化为表格布局（LayoutStyle.TAB）
 * 6. 通过 ViewModeContext.Provider 将以上所有状态和函数提供给子组件
 * 
 * @param props - 组件属性
 * @param props.children - 子组件节点，将被包裹在 Provider 中
 * @returns 包含 ViewModeContext.Provider 的 React 元素
 */
export function ViewModeProvider ({ children }: { children: ReactNode }): ReactElement {

  // 得到所有元素周期表元素数据 
  const elementsData = ElementService.getAll();

  const [layoutStyle, setLayoutStyle] = useLayoutStyle();                               // 使用自定义 Hook 管理布局样式状态：当前样式和更新函数
  const [cardsMatrix3d, setCardsMatrix3d] = useCardsMatrix3d(layoutStyle);              // 使用自定义 Hook 管理卡片 3D 矩阵数组状态（每个卡片一个矩阵）
  const [cardsWrapMatrix3d, setCardsWrapMatrix3d] = useCardsWrapMatrix3d(layoutStyle);  // 使用自定义 Hook 管理卡片容器 3D 矩阵状态（整个容器的变换矩阵）

  /**
   * 更新布局样式及其对应的矩阵状态
   * 
   * 当用户切换视图模式时调用此函数，它会：
   * 1. 更新布局样式状态
   * 2. 根据新样式重新计算卡片矩阵数组
   * 3. 根据新样式重新计算卡片容器矩阵
   * 
   * @param currentLayoutStyle - 新的布局样式（如 TAB、SPH 等）
   */
  function updateLayout (currentLayoutStyle: LayoutStyle) {
    setLayoutStyle(currentLayoutStyle);
    setCardsMatrix3d(ViewModelService.getCardsMatrix3d(currentLayoutStyle));
    setCardsWrapMatrix3d(ViewModelService.getCardsWrapMatrix3d(currentLayoutStyle));
  }

  // 组件挂载时执行一次：将布局样式初始化为表格视图（LayoutStyle.TAB）
  useEffect(() => updateLayout(LayoutStyle.TAB), []);

  return (
    <ViewModeContext.Provider value={{ 
      layoutStyle, 
      updateLayout,
      elementsData,
      cardsMatrix3d,
      cardsWrapMatrix3d,
      setCardsWrapMatrix3d
    }}>
      {children}
    </ViewModeContext.Provider>
  )
}