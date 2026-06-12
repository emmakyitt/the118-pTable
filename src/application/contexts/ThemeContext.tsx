import { createContext } from 'react';
import { ThemeService } from '@/domain/services/ThemeService';
import type { ThemeContextType } from '@/application/typings/ThemeContext';

/**
 * 创建主题上下文
 * 
 * @returns React.Context<ThemeContextType> 主题上下文对象
 */
export const ThemeContext = createContext<ThemeContextType>({

  /** 默认主题为浅色 */
  theme: 'light',

  /** 默认使用浅色主题对应的 CSS 变量 */
  themeVars: ThemeService.get('light'),

  /** 默认的 toggleTheme 为空函数，实际行为由 Provider 提供 */
  toggleTheme: () => {}
})