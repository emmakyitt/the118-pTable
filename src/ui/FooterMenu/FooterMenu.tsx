import type { Dispatch, SetStateAction, ReactElement } from 'react';
import { LayoutStyle } from '@/domain/models/typings';
import style from './FooterMenu.module.css';

interface FooterMenuProps {
  setLayoutStyle: Dispatch<SetStateAction<LayoutStyle>>;
}

export default function FooterMenu ({ setLayoutStyle }: FooterMenuProps): ReactElement {

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