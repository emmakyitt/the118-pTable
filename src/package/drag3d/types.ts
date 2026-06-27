/** 拖拽行为配置，所有字段可选 */
export interface Drag3dConfig {
  /** 触发拖拽所需的最小鼠标移动距离（像素），默认 5 */
  dragThreshold?: number
  /**
   * 惯性停止阈值（像素/秒）
   * 速度低于该值时停止动画，避免肉眼不可见的微小更新
   * 默认 5
   */
  velocityThreshold?: number
  /** 旋转灵敏度（度/像素），默认 0.1 */
  rotationSensitivity?: number
  /**
   * 惯性衰减系数 (0,1)，表示每秒速度保留的比例
   * 例如 0.05 表示每秒衰减到 5%，摩擦感强
   * 默认 0.05
   */
  friction?: number
}

/** 启用拖拽条件类型 */
export interface RefObject{
  current: boolean
}

/** Drag3d 构造函数参数 */
export interface Drag3dProps {
  /** 拖拽行为触发条件，为 false 时不触发拖拽 */
  draggable: RefObject
  /** 目标 DOM 元素 */
  target: HTMLElement
  /** 可选配置，会与默认值合并 */
  config?: Drag3dConfig
}

/** 拖拽控制器内部状态（模块化组织） */
export interface DragState {
  /** 最后移动时间 */
  times: {
    lastMoveTime: number
  }
  /** 最后移动坐标 */
  coords: {
    lastClientX: number
    lastClientY: number
  }
  /** 运动相关（旋转角度、速度） */
  motion: {
    rotateX: number
    rotateY: number
    velocityX: number
    velocityY: number
    deltaX: number
    deltaY: number
  }
  /** 状态标志位 */
  flags: {
    isDragging: boolean
    needsUpdate: boolean
  }
  /** 动画帧 ID 存储 */
  rafs: {
    dragRafId: number
    inertiaRafId: number
  }
  /** 原始样式快照 */
  originalStyles: Record<string, string>

  /** 额外 */
  [key: string]: any
}