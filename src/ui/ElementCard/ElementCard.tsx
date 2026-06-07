import type { Matrix3D } from '@/domain/models/typings';
import type { ReactElement } from 'react';
import elements from '@/assets/data/elements.json';
import style from './ElementCard.module.css';

interface ElementCardProps {
  matrix3d:Matrix3D, idx: number;
}
export default function ElementCard ({ matrix3d, idx }: ElementCardProps): ReactElement {

  return (
    <div className={ style.elementCard } style={{ transform: `matrix3d(${String(matrix3d)})` }}>
      <span className={ style.elementId }>{ elements[idx].ElementID }</span>
      <span className={ style.symbol}>{ elements[idx].Symbol }</span>
    </div>
  );
}