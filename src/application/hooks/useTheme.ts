import { useContext } from 'react';
import { ThemeContext, type ThemeContextType } from '@/application/contexts/ThemeContext';

/**
 * 自定义 Hook，用于在组件中访问主题上下文。
 *
 * 该 Hook 封装了 `useContext(ThemeContext)`，方便在组件树中任意位置
 * 访问主题相关的CSS变量和方法，无需直接引入 Context 对象。
 *
 * @returns 当前的主题上下文值，其类型为 {@link ThemeContextType}
 *   - theme: 当前主题名称，例如 'light' 或 'dark'
 *   - vars: 主题对应的 CSS 变量集合
 *   - toggleTheme: 切换主题的函数，无参数，无返回值
 *
 * @example
 * const { theme, vars, toggleTheme } = useTheme();
 */
export function useTheme (): ThemeContextType {
  return useContext(ThemeContext);
}