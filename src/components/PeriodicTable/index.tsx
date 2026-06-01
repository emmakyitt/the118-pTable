import type { Matrix3D } from '@/typings';
import type { ReactElement } from 'react';
import ElementUnit from '@/components/ElementUnit';
import './index.css';

interface PeriodicTableProps {
  elementPosition: Matrix3D[];
}

export default function PeriodicTable ({ elementPosition }: PeriodicTableProps): ReactElement {
  return (
    <div id="pTable">
      {
        elementPosition.map((matrix3d: Matrix3D, idx: number) => 
          <ElementUnit key={ idx } matrix3d={ matrix3d } idx={ idx } />
        )
      }
    </div>
  );
}