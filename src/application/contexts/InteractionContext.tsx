import { createContext } from 'react';
import type { InteractionContextType } from '@/application/typings/InteractionContext';

/**
 * 创建交互上下文（InteractionContext）对象
 * 该上下文用于在组件树中跨层级传递卡片交互相关的状态和处理函数。
 * 
 * 上下文默认值（仅用作组件未包裹 Provider 时的后备值）：
 * - cardOnClickEventHandle：卡片点击事件处理函数（返回类型为 void）
 * - isHoverHandle：鼠标悬停事件处理函数（返回类型为 void）
 * - isHover：当前悬停卡片 ID（初始为 0，表示无悬停）
 * - sectedElement：当前选中卡片 ID（初始为 0，表示无选中）
 * 
 * @remarks
 * 默认值中的函数虽然被调用时不会产生实际效果，但为了满足 TypeScript 类型检查，
 * 必须与接口定义完全一致（返回 void），因此此处使用空函数体（隐式返回 undefined）
 */
export const InteractionContext = createContext<InteractionContextType>({
  cardOnClickEventHandle: () => {},
  isHoverHandle: () => {},
  isHover: 0,
  sectedElement: 0
})