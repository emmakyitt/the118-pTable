import type { Matrix3D } from '@/domain/models/typings';
import type { ReactElement } from 'react';
import type { ElementBasic } from '@/domain/services/ElementService';
import { useElementDetail } from '@/application/hooks/useElementDetail';
import styles from './ElementCard.module.css';

interface ElementCardProps {
  matrix3d: Matrix3D; // CSS matrix3d 变换矩阵的 16 个参数
  elementId: number;  // 需要展示详情的化学元素唯一标识 ID
}

/**
 * 元素卡片组件
 * 
 * 根据传入的元素 ID 调用自定义 Hook 获取元素详细信息，
 * 在卡片中展示元素编号和化学符号，并通过 matrix3d 变换
 * 在三维空间中定位该卡片。
 * 
 * @param props.matrix3d - CSS matrix3d 变换矩阵参数, 用于控制卡片三维布局
 * @param props.elementId - 需要展示的化学元素 ID
 * @returns {ReactElement} React 元素节点
 */
export default function ElementCard ({ matrix3d, elementId }: ElementCardProps): ReactElement {

  // 调用自定义 Hook 获取元素详情，可能返回 null（例如 ID 无效或数据未加载）
  const oElement: ElementBasic | null = useElementDetail(elementId);

  return (
    <div className={ styles.elementCard } style={{ transform: `matrix3d(${ matrix3d })` }}> {/** 外层容器：应用 matrix3d 变换实现三维定位，并绑定样式 */}
      <span className={ styles.elementId }>{ oElement!.ElementID }</span> {/* 展示元素编号，使用非空断言，假定数据加载后必定存在 */}
      <span className={ styles.symbol}>{ oElement!.Symbol }</span> {/* 展示元素化学符号 */}
    </div>
  );
}