import type { Matrix3D } from "@/typings";
import ElementUnit from "@/components/ElementUnit";
import './index.css';


export default function PeriodicTable ({ matrix3dGroup }:{ matrix3dGroup: Matrix3D[] }) {
  return (
    <div id="pTable">
      {
        matrix3dGroup.map((matrix3d: Matrix3D, idx: number) => {
          return <ElementUnit key={ crypto.randomUUID() } matrix3d={ matrix3d } idx={ idx } />
        })
      }
    </div>
  );
}