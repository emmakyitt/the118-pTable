import { type ReactElement, useEffect, useRef } from 'react'
import { type Drag3dProps } from '@/package/drag3d/types'
import { useViewMode } from '@/application/hooks/useViewMode'
import { useInteraction } from '@/application/hooks/useInteraction'
import ElementCard from '@/ui/ElementCard/ElementCard'
import styles from './ElementStage.module.css'

/**
 * ElementStage 组件的属性
 */
interface ElementStageProps{
  /**
   * 拖拽初始化回调
   * @param props - 拖拽配置对象，包含目标元素、可拖拽元素 ID 引用等
   * @returns 一个包含 `destroy` 方法的对象，用于在组件卸载或依赖变化时清理拖拽实例
   */
  onDrag: (props: Drag3dProps) => { destroy: () => void }
}

/**
 * 元素周期表视图模型展示组件
 *
 * 作为元素展示的核心舞台，职责如下：
 * 1. 通过 useViewMode 获取当前视图模式下的元素列表及变换矩阵
 * 2. 内层容器展示周期表视图模型, 并应用视图类型对应的 matrix3d 变换，实现整体的旋转或缩放效果
 * 3. 遍历周期表元素数据，为每个元素渲染对应的 ElementCard，并传入其独立的 3D 变换矩阵
 *
 * @param props - 组件属性
 * @param props.onDrag - 拖拽初始化回调，用于绑定拖拽行为
 * @returns {ReactElement} 渲染出的元素周期表视图
 */
export default function ElementStage ({ onDrag }: ElementStageProps): ReactElement {

  /**
   * 周期表元素卡片容器的 DOM 引用
   * 该容器将被 onDrag 作为拖拽旋转的目标元素，
   * 需要注意其自身也承载了由 useViewMode 提供的整体 matrix3d 变换
   */
  const oCardsWarpRef = useRef<HTMLDivElement>(null)

  /**
   * 从视图模式钩子中获取：
   * - layoutStyle: 当前布局样式标识，用于触发拖拽重新绑定
   * - elementsData: 当前需展示的元素数据数组（可能为 null 或空数组）
   * - cardsMatrix3d: 每个元素卡片独立的 matrix3d 变换矩阵数组（索引 0 对应元素 ID=1，以此类推）
   * - cardsWrapMatrix3d: 整体卡片容器的 matrix3d 变换矩阵
   */
  const { layoutStyle, elementsData, cardsMatrix3d, cardsWrapMatrix3d } = useViewMode() 

  /**
   * 当前被选中的元素 ID
   * 当有元素被选中时不启用拖拽
   */
  const { sectedElement } = useInteraction()

  /**
   * 保存当前选中元素 ID, 默认为 0
   * 每次渲染时同步最新值，以确保拖拽回调中总能获取到最新的选中状态
   */
  const draggable = useRef<boolean>(Boolean(sectedElement))
  draggable.current = !sectedElement

  /**
   * 当布局样式发生变化时，重新初始化拖拽实例
   */
  useEffect(() => {

    // 拖拽控制器
    const dg = onDrag({
      target: oCardsWarpRef.current!,
      draggable,
    })

    return () => {
      dg.destroy()
    }
  }, [layoutStyle])
  
  return (
    <div 
      className={styles.pTable} 
      style={{ transform: `matrix3d(${ cardsWrapMatrix3d })` }}
      ref={ oCardsWarpRef } 
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
  )
}