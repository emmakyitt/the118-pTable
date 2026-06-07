import type { Matrix3D } from '@/domain/models/typings';
import type { ReactElement } from 'react';
import ElementCard from '@/ui/ElementCard/ElementCard';
import style from './ElementStage.module.css';

interface ElementStageProps {
  elementPosition: Matrix3D[];
}

export default function ElementStage ({ elementPosition }: ElementStageProps): ReactElement {
  return (
    <div className={style.pTable}>
      {
        elementPosition.map((matrix3d: Matrix3D, idx: number) => 
          <ElementCard key={ idx } matrix3d={ matrix3d } idx={ idx } />
        )
      }
    </div>
  );
}