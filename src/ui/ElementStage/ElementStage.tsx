import { useRef, type ReactElement } from 'react';
import { useViewMode } from '@/application/hooks/useViewMode';
import ElementCard from '@/ui/ElementCard/ElementCard';
import Drag3DAnim from '@/domain/animation/Drag3DAnim';
import styles from './ElementStage.module.css';

/**
 * 元素周期表展示组件
 * 负责渲染所有元素的卡片，并为每个卡片提供对应的 3D 变换矩阵
 * @returns {ReactElement} React 元素节点
 */
export default function ElementStage (): ReactElement {

  const oCardsWarpRef = useRef<HTMLDivElement>(null);

  // 从自定义钩子中获取元素数据数组和变换矩阵数组对象
  const { elementsData, cardsMatrix3d, cardsWrapMatrix3d } = useViewMode() 
  
  return (
    <Drag3DAnim 
      className='drag3dAnim'
      target={ oCardsWarpRef }
    >
      <div className={styles.pTable} ref={ oCardsWarpRef } style={{ transform: `matrix3d(${ cardsWrapMatrix3d })` }}>
        {
          // 遍历所有元素数据，生成对应的 ElementCard 组件
          elementsData && elementsData.map(({ ElementID }: { ElementID: number }) => 
            <ElementCard 
              key={ ElementID }                          // React 列表渲染所需的唯一 key
              matrix3d={ cardsMatrix3d![ElementID - 1] } // 根据元素 ID 获取元素对应的 3D 变换矩阵（ID 从 1 开始，数组索引从 0 开始）
              elementId={ ElementID }                    // 传递元素 ID 给卡片组件, 用于后续功能开发，如绑定元素鼠标事件等
            />
          )
        }
      </div>
    </Drag3DAnim>
  );
}