import type { Matrix3D } from "@/typings";
import ElementUnit from "@/components/ElementUnit";
import './index.css';


export default function PeriodicTable ({ elementPosition }:{ elementPosition: Matrix3D[] }) {
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