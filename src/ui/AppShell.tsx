import type { ReactElement } from 'react';
import ElementStage from '@/ui/ElementStage/ElementStage';
import ThemeSwitch from '@/ui/ThemeSwitch/ThemeSwitch';
import FooterMenu from '@/ui/FooterMenu/FooterMenu';
import '@/ui/App.css'

/**
 * 应用外壳组件
 * 负责渲染整个应用的主框架，包含元素周期表视图展示区和底部菜单栏
 * @returns {ReactElement} React 元素节点
 */
export default function AppShell(): ReactElement {
  return (
    <div className="wrapper">
      <ElementStage /> { /* 元素周期表模型视图 - 展示3D可交互的化学元素周期表 */ }
      <ThemeSwitch /> { /* 主题切换按钮的组件 - 用于切换网站的 明 / 暗主题 */}
      <FooterMenu /> { /* 底部视图切换菜单 - 提供不同显示模式的切换按钮 */ }
    </div>
  )
};