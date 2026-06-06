import type { Matrix3D } from '@/typings';
import type { ReactElement } from 'react';
import elements from '@/assets/elements';
import './index.css';

interface ElementUnitProps {
  matrix3d:Matrix3D, idx: number;
}

export default function ElementUnit ({ matrix3d, idx }: ElementUnitProps): ReactElement {
  return (
    <div className="element-unit" style={{ transform: `matrix3d(${String(matrix3d)})` }}>
      <span className="element-id">{ elements[idx].ElementID }</span>
      <span className="symbol">{ elements[idx].Symbol }</span>
    </div>
  );
}