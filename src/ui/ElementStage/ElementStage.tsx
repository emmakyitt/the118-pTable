import { useRef, type ReactElement } from 'react';
import { useViewMode } from '@/application/hooks/useViewMode';
import ElementCard from '@/ui/ElementCard/ElementCard';
import Drag3DAnim from '@/domain/animation/Drag3DAnim';
import styles from './ElementStage.module.css';

/**
 * 元素周期表视图模型展示组件
 *
 * 作为元素展示的核心舞台，职责如下：
 * 1. 通过 useViewMode 获取当前视图模式下的元素列表及变换矩阵；
 * 2. 渲染一个可被 3D 拖拽旋转的外层容器（Drag3DAnim），包裹整个周期表视图；
 * 3. 内层容器展示周期表视图模型, 并应用视图类型对应的 matrix3d 变换，实现整体的旋转或缩放效果；
 * 4. 遍历周期表元素数据，为每个元素渲染对应的 ElementCard，并传入其独立的 3D 变换矩阵
 *
 * @returns {ReactElement} 渲染出的元素周期表视图
 */
export default function ElementStage (): ReactElement {

  /**
   * 周期表元素卡片容器的 DOM 引用
   * 该容器将被 Drag3DAnim 作为拖拽旋转的目标元素，
   * 需要注意其自身也承载了由 useViewMode 提供的整体 matrix3d 变换
   */
  const oCardsWarpRef = useRef<HTMLDivElement>(null);

  /**
   * 从视图模式钩子中获取：
   * - elementsData: 当前需展示的元素数据数组（可能为 null 或空数组）
   * - cardsMatrix3d: 每个元素卡片独立的 matrix3d 变换矩阵数组（索引 0 对应元素 ID=1，以此类推）
   * - cardsWrapMatrix3d: 整体卡片容器的 matrix3d 变换矩阵
   */
  const { elementsData, cardsMatrix3d, cardsWrapMatrix3d } = useViewMode() 
  
  return (
    /**
     * Drag3DAnim 提供拖拽旋转的交互能力，
     * 将其内部作为目标元素，由（target={oCardsWarpRef}）指定，使用户可以拖拽旋转整个周期表视图
     */
    <Drag3DAnim 
      className='drag3dAnim'
      target={ oCardsWarpRef }
    >
      <div 
        className={styles.pTable} 
        ref={ oCardsWarpRef } 
        style={{ transform: `matrix3d(${ cardsWrapMatrix3d })` }}
      >
        {/**
         * 条件渲染元素卡片列表
         * elementsData 可能为 null 或空数组，此时不渲染任何内容
         *
         * 遍历时为每个元素分配：
         * - key: 元素 ID，保证 React 列表渲染性能与正确性
         * - matrix3d: 元素对应的 3D 变换矩阵，从 cardsMatrix3d 数组中按 ID-1 索引获取 （ID 从 1 开始，数组索引从 0 开始）
         *   （由于 useViewMode 确保数据存在时 cardsMatrix3d 已填充，这里使用非空断言）
         * - elementId: 原始元素 ID，供卡片内部进行事件绑定或后续扩展
         */}
        { elementsData &&
          elementsData.map(({ ElementID }: { ElementID: number }) => (
            <ElementCard
              key={ ElementID }
              matrix3d={ cardsMatrix3d![ElementID - 1] }
              elementId={ ElementID }
            />
        ))}
      </div>
    </Drag3DAnim>
  );
}