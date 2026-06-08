import type {  ReactElement } from 'react';
import { LayoutStyle } from '@/domain/models/typings';
import { useViewMode } from '@/application/hooks/useViewMode';
import style from './FooterMenu.module.css';

/**
 * 底部菜单组件
 * 展示版权信息并提供五种布局样式的切换按钮（网格、球体、表格、螺旋、随机）
 * @returns {ReactElement} React 元素
 */
export default function FooterMenu (): ReactElement {

  // 从自定义钩子中获取 setLayoutStyle 方法，用于更新全局的布局样式状态
  const { setLayoutStyle } = useViewMode();

  return (
    <div className={ style.footerMenu }>
      <div className={ style.copyright }>
        <a className={ style.copyrightSource} href='https://github.com/emmakyitt/the118-pTable' target="_self" rel="copyright">
          © 2026 Emmakyitt. ALL RIGHTS RESERVED.
        </a>
      </div>
      <div className="icon-wrapper">
        <i className={ `${style.menuIcons} ${style.griIcon}` } onClick={ () => setLayoutStyle(LayoutStyle.GRI) }></i>
        <i className={ `${style.menuIcons} ${style.sphIcon}` } onClick={ () => setLayoutStyle(LayoutStyle.SPH) }></i>
        <i className={ `${style.menuIcons} ${style.tabIcon}` } onClick={ () => setLayoutStyle(LayoutStyle.TAB) }></i>
        <i className={ `${style.menuIcons} ${style.helIcon}` } onClick={ () => setLayoutStyle(LayoutStyle.HEL) }></i>
        <i className={ `${style.menuIcons} ${style.ranIcon}` } onClick={ () => setLayoutStyle(LayoutStyle.RAN) }></i>
      </div>
    </div>
  );
}