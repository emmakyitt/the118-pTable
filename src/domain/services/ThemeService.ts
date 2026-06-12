import type { ElementCategoryThemeVars, ThemeVars } from '@/domain/typings/theme';
import themeVars from '@/domain/theme/config.json';

/**
 * 主题管理器
 *
 * 负责管理多个预定义主题（如亮色/暗色），提供主题获取、CSS 变量名转换、
 * 将主题变量注入 DOM 以及按分类名获取元素特定主题等功能。
 * 所有主题变量统一存储在静态私有属性 `themes` 中，避免重复加载。
 */
export class ThemeService {

  /**
   * 存储所有预定义主题的变量集
   * 键为主题名称（如 'light', 'dark'），值为对应的 CSS 变量集合
   */
  private static readonly themes: Record<string, ThemeVars> = themeVars;
  
  /**
   * 根据主题名称获取对应的 CSS 变量集
   * 若主题不存在，则默认返回 `light` 主题的变量集，保证界面总有一个可用主题
   *
   * @param {string} theme - 主题名称，例如 'light' 或 'dark'
   * @returns {ThemeVars} 对应主题的 CSS 变量对象
   */
  static get(theme: string): ThemeVars {
    return this.themes[theme] || this.themes.light
  }

  /**
   * 将驼峰命名的属性名转换为 CSS 自定义属性（变量）名
   * 转换规则：在每一个大写字母前插入连字符，然后全部转为小写，并加上前缀 "--"
   * 例如 "primaryColor" → "--primary-color"
   *
   * @param {string} str - 驼峰格式的属性名
   * @returns {string} 对应的 CSS 变量名，如 "--primary-color"
   */
  static getCssVarName(str: string): string {
      return "--" + str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * 将主题变量对象中的属性一一转换为 CSS 变量，并设置到目标 DOM 元素上
   * 会跳过 `elementCategory` 属性（该属性用于卡片元素分类主题，不直接映射为 CSS 变量）
   *
   * @param {ThemeVars} themeVars - 需要应用的主题变量对象
   * @returns void
   */
  static applyThemeToDom(themeVars: ThemeVars): void {
    Object.entries(themeVars).forEach(([key, value]) => {

      // elementCategory 是嵌套对象，不直接转换为 CSS 变量，故跳过
      if (key != "elementCategory") {
        document.documentElement.style.setProperty(this.getCssVarName(key), value);
      }
    });
  }

  // 将当前主题类型名称存放到localStorage中
  static applyThemeToLocalStorage (themeName: string) {
    localStorage.setItem('the118-currentTheme', themeName);
  }

  /**
   * 根据元素分类键名（如 'metal', 'nonmetal'）获取该分类专属的主题变量
   * 所有分类变量均存储在 theme.elementCategory 下，每个分类是一个 ElementCategoryThemeVars 对象
   *
   * @param {ThemeVars} theme - 完整的主题变量对象，其中包含 elementCategory 字段
   * @param {string} key - 元素分类的键名，例如 'metal'
   * @returns {ElementCategoryThemeVars} 该分类对应的主题变量（颜色、边框等）
   */
  static getElementCategoryThemeVarsByClassName (
    theme: ThemeVars, 
    key: string): ElementCategoryThemeVars {
      return theme.elementCategory[key];
  }
}