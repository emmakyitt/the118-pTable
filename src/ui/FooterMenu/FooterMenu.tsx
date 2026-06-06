import type { Dispatch, SetStateAction, ReactElement } from 'react';
import { MoStatus } from '@/typings';
import './index.css';

interface BottomMenuProps {
  setMoStatus: Dispatch<SetStateAction<MoStatus>>;
}

export default function BottomMenu ({ setMoStatus }: BottomMenuProps): ReactElement {

  return (
    <div className="bottom-menu">
      <div className="copyright">
        <a className="copyright-source" href='https://github.com/emmakyitt/the118-pTable' target="_self" rel="copyright">
          © 2026 Emmakyitt. ALL RIGHTS RESERVED.
        </a>
      </div>
      <div className="icon-wrapper">
        <i className="gr-icon menu-icons" onClick={ () => setMoStatus(MoStatus.Gr) }></i>
        <i className="sp-icon menu-icons" onClick={ () => setMoStatus(MoStatus.Sp) }></i>
        <i className="ta-icon menu-icons" onClick={ () => setMoStatus(MoStatus.Ta) }></i>
        <i className="he-icon menu-icons" onClick={ () => setMoStatus(MoStatus.He) }></i>
        <i className="co-icon menu-icons" onClick={ () => setMoStatus(MoStatus.Ra) }></i>
      </div>
    </div>
  );
}