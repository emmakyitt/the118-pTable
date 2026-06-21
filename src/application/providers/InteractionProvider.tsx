import { type ReactNode, type MouseEvent, type ReactElement, useEffect, useState } from 'react';
import { useViewMode } from '@/application/hooks/useViewMode';
import { ViewModelService } from '@/domain/services/ViewModelService';
import { InteractionContext } from '@/application/contexts/InteractionContext';

/**
 * 交互上下文提供者组件
 * 
 * 该组件负责管理卡片交互状态（悬停、点击选中），
 * 并将状态与处理函数通过 InteractionContext 提供给后代组件
 * 
 * @param props.children - 子组件节点
 * @returns {ReactElement} 带有交互上下文的 React 元素
 */
export function InteractionProvider ({ children }: { children: ReactNode }): ReactElement {

  // 当前悬停的卡片 ID，0 表示无悬停
  const [ isHover, setIsHover ] = useState<number>(0);

  // 从视图模式上下文中获取布局样式、当前选中元素以及更新选中和容器矩阵的函数
  const { layoutStyle, sectedElement, setSectedElement, setCardsWrapMatrix3d } = useViewMode();

  /**
   * 卡片点击事件处理函数
   * 
   * 当用户点击卡片时，计算新的容器 3D 变换矩阵并更新，
   * 同时更新选中的卡片 ID，并阻止事件冒泡
   * 
   * @param e - 鼠标事件（React 事件或原生事件）
   * @param elementId - 被点击的卡片 ID
   * @returns {void} 无返回值
   */
  function cardOnClickEventHandle (e: MouseEvent<HTMLDivElement> | globalThis.MouseEvent, elementId: number) {

    // 根据当前布局和点击的卡片 ID 计算新的容器变换矩阵并应用
    setCardsWrapMatrix3d(ViewModelService.getCardsWrapMatrix3d(layoutStyle, elementId));
    setSectedElement(elementId);  // 更新选中卡片 ID 
    e.stopPropagation();          // 阻止事件冒泡，避免触发全局点击处理
  }

  /**
   * 全局点击事件处理函数（用于点击空白区域取消选中）
   * 
   * 当存在选中的卡片（sectedElement 不为 0）且点击发生在容器外部时，
   * 调用 cardOnClickEventHandle 并传入 elementId = 0 以取消选中
   * 
   * @param e - 原生鼠标事件
   * @returns {void} 无返回值
   * 
   * @remarks
   * 此函数作为 document 的 click 事件监听器使用，因此参数类型为原生 MouseEvent。
   */
  function wrapperOnClickHandle (e: globalThis.MouseEvent): void {

    // 如果当前有选中的元素，则通过卡片点击处理函数取消选中（elementId=0）
    if (sectedElement) cardOnClickEventHandle(e, 0);
  } 

  /**
   * 鼠标悬停进入事件处理函数
   * 
   * 更新当前悬停的卡片 ID，并阻止事件冒泡
   * 
   * @param e - React 鼠标事件（绑定在 卡片元素 上）
   * @param elementId - 悬停的卡片 ID
   * @returns {void} 无返回值
   */
  function isHoverHandle (e: MouseEvent<HTMLDivElement>, elementId: number) {
    setIsHover(elementId);
    e.stopPropagation();
  }

  // ---------- 副作用：全局点击监听 ----------
  useEffect(() => {

    // 在 document 上添加点击监听，用于处理点击外部取消选中
    document.addEventListener('click', wrapperOnClickHandle);

    return function () { // 清理函数：移除监听，防止内存泄漏
      document.removeEventListener('click', wrapperOnClickHandle);
    }
  }, [layoutStyle, sectedElement]); // 依赖项：当布局或选中状态变化时重新绑定（确保使用最新值）

  return (
    <InteractionContext.Provider value={{ 
      isHover,
      isHoverHandle,
      sectedElement, 
      cardOnClickEventHandle 
    }}>
      {children}
    </InteractionContext.Provider>
  )
}