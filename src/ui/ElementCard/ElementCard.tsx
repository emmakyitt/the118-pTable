import type { ReactElement } from 'react';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';
import type { IElementBasic } from '@/assets/data/typings/elements';
import { useElementDetail } from '@/application/hooks/useElementDetail';
import { useInteraction } from '@/application/hooks/useInteraction';
import styles from './ElementCard.module.css';

interface ElementCardProps {
  matrix3d: Matrix3d; // CSS matrix3d 变换矩阵的 16 个参数
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

  // 调用自定义 Hook 获取元素详情
  const oElement: IElementBasic = useElementDetail(elementId);
  const { isHover, isHoverHandle, sectedElement, cardOnClickEventHandle } = useInteraction();

  return (
    <div 
      className={ 
        `${ styles.elementCard } 
         ${ sectedElement === elementId && styles.cardSelected }
         ${ isHover === elementId && styles.cardSelected }
        `
      } 
      onClick={ e =>  cardOnClickEventHandle(e, elementId) }
      onMouseEnter={ e => isHoverHandle(e, elementId) }
      onMouseLeave={ e => isHoverHandle(e, 0) }
      style={{ transform: `matrix3d(${ matrix3d })` }}> {/** 外层容器：应用 matrix3d 变换实现三维定位，并绑定样式 */}
      <span className={ styles.elementId }>{ oElement.ElementID }</span> {/* 展示元素编号 */}
      <span className={ styles.symbol}>{ oElement.Symbol }</span> {/* 展示元素化学符号 */}
    </div>
  );
}