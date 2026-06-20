import { useContext } from 'react';
import { InteractionContext } from '@/application/contexts/InteractionContext';
import type { InteractionContextType } from '@/application/typings/InteractionContext';

/**
 * 自定义 Hook：用于获取交互上下文（InteractionContext）的值
 * 
 * 该 Hook 封装了 useContext(InteractionContext)，方便组件消费卡片交互相关的状态与事件处理函数
 * 
 * @returns {InteractionContextType} 返回交互上下文对象，包含：
 *   - cardOnClickEventHandle：卡片点击事件处理函数
 *   - isHoverHandle：鼠标悬停事件处理函数
 *   - isHover：当前悬停卡片 ID
 *   - sectedElement：当前选中卡片 ID
 * 
 * @example
 *   const { cardOnClickEventHandle, isHover } = useInteraction();
 */
export function useInteraction (): InteractionContextType {
  return useContext(InteractionContext);
}