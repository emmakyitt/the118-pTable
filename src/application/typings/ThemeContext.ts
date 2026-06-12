import type { ThemeVars } from '@/domain/typings/theme';

export interface ThemeContextType {

  /** 当前主题名称，例如 'light' 或 'dark' */
  theme: string;

  /** 主题对应的 CSS 变量集合 */
  themeVars: ThemeVars;

  /** 切换主题的函数，无参数，无返回值 */
  toggleTheme: () => void;
}