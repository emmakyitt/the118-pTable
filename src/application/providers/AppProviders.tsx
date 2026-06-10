import { ViewModeProvider } from '@/application/providers/ViewModeProvider';
import { ThemeProvider } from '@/application/providers/ThemeProvider';
import type { ReactElement, ReactNode } from 'react';

/**
 * 应用全局提供者组件
 * 在此处包裹所有需要全局上下文（如视图模式）的子组件
 * @param children - 被包裹的子节点
 * @returns ReactElement 元素组件
 */
export function AppProviders ({ children }: { children: ReactNode }): ReactElement {
  return (
    <ThemeProvider>
      <ViewModeProvider>
        {children}
      </ViewModeProvider>
    </ThemeProvider>
  )
}
