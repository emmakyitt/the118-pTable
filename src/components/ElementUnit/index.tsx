import type { Matrix3D } from "@/typings";
import elements from "@/assets/elements";
import './index.css';

export default function ElementUnit ({ matrix3d, idx }: {matrix3d:Matrix3D, idx: number}) {
  return (
    <div style={{ transform: `matrix3d(${String(matrix3d)})` }}>
      <span>{ elements[idx].Symbol } {++idx}</span>
    </div>
  );
}