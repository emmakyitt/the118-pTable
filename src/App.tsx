import { useState, useEffect } from 'react';
import { MoStatus, type Matrix3D } from '@/typings';
import { VisualModelFactory } from '@/visual';
import PeriodicTable from '@/components/PeriodicTable';
import BottomMenu from '@/components/BottomMenu';
import '@/App.css'

/**
 * 应用根组件
 * 根据当前布局模式 moStatus 创建对应的视觉模型，并展示其 3D 矩阵
 */
export default function App() {
  const [ matrix3d, setMatrix3d ] = useState<Matrix3D[] | null>(null);
  const [ moStatus, setMoStatus ] = useState<MoStatus>(MoStatus.Ta);

  useEffect(function () {
    try {

      // 通过基类工厂机制实例化具体视图模型（内部根据 moStatus 路由）
      const visualModel = new VisualModelFactory(moStatus);

      // 同步获取元素matrix3d矩阵并更新视图
      setMatrix3d(visualModel.getMatrix3d());

    } catch (e: any) {

      console.error('Visual model creation failed', e);
      setMatrix3d(null);
    }
    // 当前为同步操作，无需清理；若后续改为异步，可在此返回清理函数
  }, [moStatus]);

  return (
    <div className="wrapper">
      { matrix3d && <PeriodicTable elementPosition={matrix3d}/> }
      <BottomMenu setMoStatus={ setMoStatus } />
    </div>
  )
};