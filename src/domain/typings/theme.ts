// 单个元素分类的主题变量
export interface ElementCategoryThemeVars {
  cardBg: string;
  cardIdText: string;
  cardBorder: string;
  cardSymbolText: string;
}

// 元素分类集合：键为分类名，值为该分类的主题变量
export interface ElementCategoryType {
  [category: string]: ElementCategoryThemeVars;
}

// 完整的一套主题变量
export interface ThemeVars {
  pageBg: string;
  cardBg: string;
  cardIdText: string;
  cardBorder: string;
  cardShadow: string;
  cardSymbolText: string;
  footerMenuBg: string;
  footerMenuIconsBorder: string;
  footerMenuIconsFill: string;
  footerMenuIconsHoverColor: string;
  copyrightSourceText: string;
  themeSwitchBg: string;
  themeSwitchText: string;
  themeSwitchBoder: string;
  elementCategory: ElementCategoryType;

  // [key: string]: string | ElementCategoryType;
}