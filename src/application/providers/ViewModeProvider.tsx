import { ElementService } from '@/domain/services/ElementService';
import { useLayoutStyle } from '@/application/hooks/useLayoutStyle';
import { ViewModeContext } from '@/application/contexts/ViewModeContext';
import { useMatrix3dGroup } from '@/application/hooks/useMatrix3dGroup';
import type { ReactElement, ReactNode } from 'react';

/**
 * 提供当前视图模式及切换函数的上下文提供者组件
 * @param children - 子组件节点
 * @returns 包含视图模式上下文值的 Provider 组件
 */
export function ViewModeProvider ({ children }: { children: ReactNode }): ReactElement {

  // 得到当前布局模式及更新函数 
  const [layoutStyle, setLayoutStyle] = useLayoutStyle();

  // 得到所有元素周期表元素数据 
  const elementsData = ElementService.getAll();

  // 根据当前 layoutStyle 的状态得到视图模型的变换矩阵组数据
  const matrix3dGroup = useMatrix3dGroup(layoutStyle);

  return (
    <ViewModeContext.Provider value={{ 
      layoutStyle, 
      setLayoutStyle,
      elementsData,
      matrix3dGroup,
    }}>
      {children}
    </ViewModeContext.Provider>
  )
}