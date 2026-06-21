import type { MouseEvent } from 'react';

/**
 * 交互上下文（InteractionContext）的类型定义
 * 用于在组件树中共享卡片交互相关的状态与事件处理函数
 */
export interface InteractionContextType {
  /**
   * 卡片点击事件处理函数
   * @param e - React 鼠标事件对象，绑定在 HTMLDivElement 上
   * @param elementId - 被点击卡片的唯一标识 ID
   * @returns void（无返回值）
   */
  cardOnClickEventHandle: (e: MouseEvent<HTMLDivElement>, elementId: number) => void;

  /**
   * 鼠标悬停（hover）事件处理函数
   * @param e - React 鼠标事件对象，绑定在 HTMLDivElement 上
   * @param elementId - 被悬停卡片的唯一标识 ID
   * @returns void（无返回值）
   */
  isHoverHandle: (e: MouseEvent<HTMLDivElement>, elementId: number) => void;

  /**
   * 当前正处于悬停状态的卡片 ID
   * 若为 0 表示无悬停
   */
  isHover: number;

  /**
   * 当前被选中的卡片 ID
   * 若为 0 表示无选中
   */
  sectedElement: number;
}