import type { Matrix3D } from '@/domain/models/typings';
import type { ReactElement } from 'react';
import type { ElementBasic } from '@/domain/services/ElementService';
import { useElementDetail } from '@/application/hooks/useElementDetail';
import style from './ElementCard.module.css';

interface ElementCardProps {
  matrix3d: Matrix3D;
  elementId: number;
}

/**
 * 元素卡片组件
 * 
 * 根据传入的元素 ID 获取详情，展示元素编号和符号。并以matrix3d变换矩阵生成元素卡片三维布局坐标点
 * 
 * @param props.matrix3d - CSS matrix3d 变换矩阵参数
 * @param props.elementId - 需要展示的化学元素 ID
 * @returns {ReactElement} React 元素节点
 */
export default function ElementCard ({ matrix3d, elementId }: ElementCardProps): ReactElement {

  // 调用自定义 Hook 获取元素详情，可能返回 null（例如 ID 无效或数据未加载）
  const oElement: ElementBasic | null = useElementDetail(elementId);

  return (
    <div className={ style.elementCard } style={{ transform: `matrix3d(${ matrix3d })` }}>
      <span className={ style.elementId }>{ oElement!.ElementID }</span>
      <span className={ style.symbol}>{ oElement!.Symbol }</span>
    </div>
  );
}