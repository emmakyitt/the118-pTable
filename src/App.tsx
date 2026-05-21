import { useState, useEffect } from 'react';
import { MoStatus, type Matrix3D } from '@/typings';
import { VisualModel } from '@/visual';

export default function App() {
  const [ matrix3d, setMatrix3d ] = useState<Matrix3D | null>(null);
  const [ moStatus, setMoStatus ] = useState<MoStatus>(MoStatus.ta);

  useEffect(function () {
    const model = new VisualModel(moStatus);
    model.create(setMatrix3d);
    // 清理函数，如果需要可以取消异步操作（此处为同步调用，可省略）
  }, [moStatus]);


  return (
    <>
      {matrix3d && <pre>{JSON.stringify(matrix3d, null, 2)}</pre>}
    </>
  )
};