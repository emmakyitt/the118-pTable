import { useState, useEffect } from 'react';
import { LayoutStyle, type Matrix3D } from '@/domain/models/typings';
import { ViewModelFactory } from '@/domain/viewModels';
import ElementStage from '@/ui/ElementStage/ElementStage';
import FooterMenu from '@/ui/FooterMenu/FooterMenu';
import '@/App.css'

/**
 * 应用根组件
 * 根据 layoutStyle 状态创建对应的模型视图
 */
export default function App() {
  const [ matrix3d, setMatrix3d ] = useState<Matrix3D[] | null>(null);
  const [ layoutStyle, setLayoutStyle ] = useState<LayoutStyle>(LayoutStyle.TAB);

  useEffect(function () {
    try {

      // 通过基类工厂机制实例化具体视图模型（内部根据 layoutStyle 路由）
      const viewModel = new ViewModelFactory(layoutStyle);

      // 同步获取元素matrix3d矩阵并更新视图
      setMatrix3d(viewModel.getMatrix3d());

    } catch (e: any) {

      console.error('Visual model creation failed', e);
      setMatrix3d(null);
    }
    // 当前为同步操作，无需清理；若后续改为异步，可在此返回清理函数
  }, [layoutStyle]);

  return (
    <div className="wrapper">
      { matrix3d && <ElementStage elementPosition={matrix3d}/> }
      <FooterMenu setLayoutStyle={ setLayoutStyle } />
    </div>
  )
};

