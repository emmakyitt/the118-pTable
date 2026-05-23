import { useState, useEffect } from 'react';
import { MoStatus, type Matrix3D } from '@/typings';
import { VisualModel } from '@/visual';
import PeriodicTable from '@/components/PeriodicTable';
import '@/App.css'

/**
 * 应用根组件
 * 根据当前布局模式 moStatus 创建对应的视觉模型，并展示其 3D 矩阵
 */
export default function App() {
  const [ matrix3d, setMatrix3d ] = useState<Matrix3D[] | null>(null);
  const [ moStatus, ] = useState<MoStatus>(MoStatus.Ta);

  useEffect(function () {
    try {

      // 通过基类工厂机制实例化具体模型（内部根据 moStatus 路由）
      const model = new VisualModel(moStatus);

      // 同步获取矩阵并更新视图
      setMatrix3d(model.getMatrix3d());

    } catch (e: any) {

      console.error('模型创建失败:', e);
      setMatrix3d(null);
    }
    // 当前为同步操作，无需清理；若后续改为异步，可在此返回清理函数
  }, [moStatus]);

  return (
    <>
      { matrix3d && <PeriodicTable matrix3dGroup={matrix3d}/> }
    </>
  )
};