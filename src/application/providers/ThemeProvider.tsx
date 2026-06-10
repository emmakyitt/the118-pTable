import { useState, type ReactNode, type ReactElement } from 'react';
import { ThemeContext } from '@/application/contexts/ThemeContext';
import { ThemeService } from '@/domain/services/ThemeService';

/**
 * 主题提供者组件
 *
 * 作为应用的主题状态容器，负责：
 * 1. 管理当前主题名称（优先从localStorage 获取，不存在则使用默认'light'）
 * 2. 提供 toggleTheme 方法，在 'light' 和 'dark' 之间切换
 * 3. 自动将当前主题的 CSS 变量应用到 document.documentElement
 * 4. 将当前主题名保存到 localStorage，后续直接从localStorage中读取
 * 5. 通过 React Context 向子组件树注入主题变量和切换函数
 *
 * @param children - 需要包裹在主题上下文中的子节点
 * @returns 返回包含主题上下文值的 Provider 组件
 */
export function ThemeProvider ({ children }: { children: ReactNode }): ReactElement {

  // 初始化主题状态：优先读取 localStorage 中的 'the118-currentTheme'，
  // 若不存在则回退到 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('the118-currentTheme') ?? 'light');

  const themeVars = ThemeService.get(theme);  // 根据当前主题名获取对应的完整 CSS 变量集（ThemeVars 对象）
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));  // 切换主题方法：在 'light' 和 'dark' 之间切换

  ThemeService.applyThemeToDom(themeVars);        // 将当前主题变量转换为 CSS 自定义属性并注入 :root，实现全局样式切换
  ThemeService.applyThemeToLocalStorage(theme);   // 将当前主题名持久化到 localStorage，以便刷新后仍保持用户选择

  return (
    // 通过 Context.Provider 将 { theme, themeVars, toggleTheme } 注入子组件树
    <ThemeContext.Provider value={{ theme, themeVars, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}