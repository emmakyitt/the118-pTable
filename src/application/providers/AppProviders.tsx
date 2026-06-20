import { ThemeProvider } from '@/application/providers/ThemeProvider';
import { ViewModeProvider } from '@/application/providers/ViewModeProvider';
import { InteractionProvider } from '@/application/providers/InteractionProvider';
import type { ReactElement, ReactNode } from 'react';

/**
 * 应用全局提供者组件
 * 
 * 该组件按照 配色主题 → 视图模式 → 用户交互 的层次顺序嵌套多个上下文提供者，
 * 为整个应用提供统一的状态管理和样式环境
 * 
 * 嵌套顺序说明：
 * 1. ThemeProvider：最外层，提供全局主题（暗色/亮色等）
 * 2. ViewModeProvider：第二层，提供视图布局、卡片数据与 3D 变换矩阵
 * 3. InteractionProvider：最内层，提供鼠标点击、悬停等交互状态与处理函数。
 * 
 * 子组件（如页面、卡片列表）可通过相应的自定义钩子（如 useTheme、useViewMode、useInteraction）
 * 消费这些上下文提供的值。
 * 
 * @param props.children - 需要被包裹的子组件树
 * @returns {ReactElement} 渲染后的组件树，附带所有上下文提供者
 */
export function AppProviders ({ children }: { children: ReactNode }): ReactElement {
  return (
    <ThemeProvider>
      <ViewModeProvider>
        <InteractionProvider>
          {children}
        </InteractionProvider>
      </ViewModeProvider>
    </ThemeProvider>
  )
}
