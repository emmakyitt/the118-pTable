import type { Dispatch, SetStateAction, ReactElement } from 'react';
import { MoStatus } from '@/typings';
import './index.css';

interface BottomMenuProps {
  setMoStatus: Dispatch<SetStateAction<MoStatus>>;
}

export default function BottomMenu ({ setMoStatus }: BottomMenuProps): ReactElement {

  return (
    <div className="bottom-menu">
      <div className="copyright" children='© 2026 Emmaky. ALL RIGHTS RESERVED.' />
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