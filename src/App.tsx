import type { ReactElement } from 'react';
import { AppProviders } from '@/application/providers/AppProviders';
import AppShell from '@/ui/AppShell';

/**
 * 应用程序的根组件。
 * 使用 `AppProviders` 包装 `AppShell`，为整个应用提供必要的上下文（例如状态管理、路由等）。
 * @returns {ReactElement} 返回一个 React 元素，代表整个应用的根结构。
 */
export default function App(): ReactElement {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  )
};