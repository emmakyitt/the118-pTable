import type { Matrix3D } from "@/typings";
import elements from "@/assets/elements";
import './index.css';

export default function ElementUnit ({ matrix3d, idx }: {matrix3d:Matrix3D, idx: number}) {
  return (
    <div className="element-unit" style={{ transform: `matrix3d(${String(matrix3d)})` }}>
      <span className="element-id">{ elements[idx].ElementID }</span>
      <span className="symbol">{ elements[idx].Symbol }</span>
    </div>
  );
}