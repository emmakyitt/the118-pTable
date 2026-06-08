import type { ReactElement } from 'react';
import ElementStage from '@/ui/ElementStage/ElementStage';
import FooterMenu from '@/ui/FooterMenu/FooterMenu';
import style from '@/ui/App.module.css'

/**
 * 应用外壳组件
 * 负责渲染整个应用的主框架，包含元素周期表视图展示区和底部菜单栏
 * @returns {ReactElement} React 元素节点
 */
export default function AppShell(): ReactElement {
  return (
    <div className={ style.wrapper }>
      <ElementStage /> { /* 元素周期表模型视图 - 展示3D可交互的化学元素周期表 */ }
      <FooterMenu /> { /* 底部视图切换菜单 - 提供不同显示模式的切换按钮 */ }
    </div>
  )
};