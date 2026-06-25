/**
 * @file 3D 拖拽旋转工具
 *
 * 通过监听鼠标拖拽事件实时旋转目标 DOM 元素
 * 支持可配置的拖拽阈值、旋转灵敏度、惯性衰减参数
 * 松手后自动启动基于物理模型的惯性衰减动画
 * 提供 destroy 方法彻底清理所有监听和动画
 * 
 * 
 * =================== 性能优化说明 ===================
 * 
 * 优化点：
 * 1. will-change 动态管理
 *    - 在拖拽和惯性动画开始时设置 will-change: transform，提前将元素提升为合成层（GPU 加速）
 *    - 动画停止后立即恢复原始 will-change 值，避免长期占用 GPU 内存
 *
 * 2. 拖拽帧节流（requestAnimationFrame 合并更新）
 *    - 使用 rAF 将高频 mousemove 触发的 transform 更新合并到每帧一次
 *    - 通过 needsUpdate 标记防止同一帧内重复请求，消除无效样式计算与布局抖动
 *    - 保证渲染与屏幕刷新率严格同步，维持 60fps 流畅体验
 *
 * 3. 阈值平方比较
 *    - 拖拽触发阈值与惯性停止阈值均预先计算平方值 (threshold²)
 *    - 比较时直接使用位移/速度的平方和，省去 Math.hypot 的开方运算，减少 CPU 微开销
 *
 * 4. 样式直接赋值替代字符串转换
 *    - 对 transition / pointer-events / will-change 直接操作 style 对象属性
 *    - 避免 formatCssName / setProperty 的字符串拼接与查找，代码更简洁
 *
 * 其他优化：
 *    - 动画循环使用 requestAnimationFrame 替代 setInterval，与屏幕刷新率对齐
 *    - 基于时间差 (dt) 实现指数衰减：Math.pow(friction, dt)，确保不同刷新率下惯性表现一致
 *    - 动画期间设置 pointer-events: none 阻止鼠标事件额外开销
 *    - 松手时立即移除事件监听，杜绝残留回调干扰
 *    - 增加 mouseleave / window.blur 监听，强制结束拖拽防止状态残留
 */

import type { Matrix3d } from '@/infrastructure/typings/matrixTools'

// -------------------- 类型定义 --------------------

/** 拖拽行为配置，所有字段可选 */
interface Drag3dConfig {
  /** 触发拖拽所需的最小鼠标移动距离（像素），默认 5 */
  dragThreshold?: number
  /** 旋转灵敏度（度/像素），默认 0.1 */
  rotationSensitivity?: number
  /**
   * 惯性衰减系数 (0,1)，表示每秒速度保留的比例
   * 例如 0.05 表示每秒衰减到 5%，摩擦感强
   * 默认 0.05
   */
  friction?: number
  /**
   * 惯性停止阈值（像素/秒）
   * 速度低于该值时停止动画，避免肉眼不可见的微小更新
   * 默认 5
   */
  velocityThreshold?: number
}

/** Drag3d 构造函数参数 */
interface Drag3dProps {
  /** 是否启用拖拽，为 false 时不绑定任何事件 */
  isDrag: boolean
  /** 目标 DOM 元素 */
  oElement: HTMLElement
  /**
   * 旋转角度到 matrix3d 的转换函数
   * @param v1 绕 X 轴累计角度（度）
   * @param v2 绕 Y 轴累计角度（度）
   * @returns 适用于 CSS transform 的 matrix3d 值
   */
  setMatrix3d: (v1: number, v2: number) => Matrix3d
  /** 可选配置，会与默认值合并 */
  config?: Drag3dConfig
}

// -------------------- 默认常量 --------------------

/** 默认配置值，所有字段均可被外部覆盖 */
const DEFAULT_CONFIG = {
  dragThreshold: 5,
  rotationSensitivity: 0.1,
  friction: 0.05,
  velocityThreshold: 5,
} as const

// -------------------- 主函数 --------------------

/**
 * 创建 3D 拖拽控制器
 *
 * 工作流程：
 * 1. 左键按下 → 记录起点，绑定事件
 * 2. 移动超过阈值 → 进入拖拽，实时旋转
 * 3. 松手/离开/失焦 → 若曾拖拽则启动惯性动画
 * 4. 调用 destroy() 彻底清理所有副作用
 *
 * @param props 配置参数
 * @returns 包含 destroy 方法的对象
 */
export default function Drag3d({
  isDrag,
  oElement,
  setMatrix3d,
  config = {},
}: Drag3dProps): { destroy: () => void } {
  // 合并配置
  const {
    dragThreshold,
    rotationSensitivity,
    friction,
    velocityThreshold,
  } = { ...DEFAULT_CONFIG, ...config }

  // 预计算阈值的平方，用于快速比较
  const dragThresholdSq = dragThreshold * dragThreshold
  const velocityThresholdSq = velocityThreshold * velocityThreshold

  // -------------------- 内部状态 --------------------

  interface DragState {
    deltaX: number
    deltaY: number
    rotateX: number
    rotateY: number
    velocityX: number
    velocityY: number 
    dragRafId: number            // 拖拽节流 rAF ID
    animFrameId: number          // 惯性动画 rAF ID
    lastClientX: number
    lastClientY: number
    lastMoveTime: number
    needsUpdate: boolean         // 拖拽帧更新标记
    isDragging: boolean
    originalStyles: Record<string, string>
  }

  const state: DragState = {
    deltaX: 0,
    deltaY: 0,
    rotateX: 0,
    rotateY: 0,
    velocityX: 0,
    velocityY: 0,
    dragRafId: 0,
    animFrameId: 0,
    lastClientX: 0,
    lastClientY: 0,
    lastMoveTime: 0,
    needsUpdate: false,
    isDragging: false,
    originalStyles: {},
  }

  // -------------------- 工具函数 --------------------

  /** 更新最近一次鼠标坐标 */
  function updateCoords(e: MouseEvent): void {
    state.lastClientX = e.clientX
    state.lastClientY = e.clientY
  }

  /**
   * 根据当前位移和时间差计算速度（像素/秒）
   * 副作用：更新 state.velocityX / state.velocityY
   * dt 过小时（<0.001秒）速度置零，避免除零异常
   */
  function updateVelocityXY(): void {
    const now = performance.now()
    const dt = (now - state.lastMoveTime) / 1000
    state.velocityX = dt > 0.001 ? state.deltaX / dt : 0
    state.velocityY = dt > 0.001 ? state.deltaY / dt : 0
  }

  /** 记录最后一次移动时间，用于速度计算 */
  function updateLastMoveTime(): void {
    state.lastMoveTime = performance.now()
  }

  /**
   * 基于位移增量直接更新旋转角度（拖拽时使用）
   * - 副作用：累加 state.rotateX / state.rotateY
   * - 注意：X 轴旋转对应鼠标垂直移动 (deltaY)，Y 轴旋转对应水平移动 (deltaX)
   */
  function applyRotationFromDelta(): void {
    state.rotateX += state.deltaY * rotationSensitivity
    state.rotateY += state.deltaX * rotationSensitivity
  }

  /**
   * 基于速度和时间差更新旋转角度（惯性动画专用）
   * - 副作用：累加 state.rotateX / state.rotateY
   * - 保证帧率无关：速度乘以 dt 得到本帧位移量
   */
  function applyRotationFromVelocity(dt: number): void {
    state.rotateX += state.velocityY * rotationSensitivity * dt
    state.rotateY += state.velocityX * rotationSensitivity * dt
  }

  /**
   * 将当前角度通过外部回调转化为 matrix3d 并应用到元素上
   * 注意：此处直接操作 style.transform，无过渡影响（transition 已被设为 none）
   */
  function updateTransform(): void {
    if (!oElement) return
    oElement.style.transform = `matrix3d(${setMatrix3d(state.rotateX, state.rotateY)})`
  }
  // -------------------- 样式处理器 --------------------

  /**
   * 应用拖拽/动画期间的专用样式
   * - 禁用 transition：避免矩阵更新被过渡动画干扰
   * - 禁用 pointer-events：阻止动画期间鼠标移动触发额外计算
   * - 开启 will-change: transform：提前提升合成层，实现 GPU 加速
   */  
  function applyDragStyles(): void {
    oElement.style.transition = 'none'
    oElement.style.pointerEvents = 'none'
    oElement.style.willChange = 'transform'
  }

  /** 恢复元素样式的原始值 */
  function restoreOriginalStyles(): void {
    oElement.style.transition = state.originalStyles.transition
    oElement.style.pointerEvents = state.originalStyles.pointerEvents
    oElement.style.willChange = state.originalStyles.willChange
  }

  /**
   * 保存目录元素样式值到状态中, 用于后期恢复
   * 注意: 优先读取内联样式
   */
  function saveOriginalStylesToState(): void {
    state.originalStyles = {
      pointerEvents: oElement.style.pointerEvents || window.getComputedStyle(oElement).pointerEvents,
      transition: oElement.style.transition || window.getComputedStyle(oElement).transition,
      willChange: oElement.style.willChange || window.getComputedStyle(oElement).willChange,
    }
  }

  // -------------------- 动画处理器 --------------------

  /** 取消惯性动画帧 */
  function clearDecayAnim(): void {
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId)
      state.animFrameId = 0
    }
  }

  
  /**
   * 启动惯性衰减动画（基于指数衰减模型）
   * - 使用 requestAnimationFrame 驱动，与屏幕刷新同步
   * - 衰减公式：v = v₀ · friction^dt，实现帧率无关
   * - 合速度低于阈值时自动停止并恢复样式
   */
  function startDecayAnim(): void {
    if (!oElement) return
    clearDecayAnim()

    // 防御性禁用，确保动画环境干净
    applyDragStyles()

    let lastTime = performance.now()

    /** 动画循环：每帧衰减速度，低于阈值则停止并恢复样式 */
    function tick(now: number) {
      const dt = Math.min(now - lastTime, 100) / 1000
      lastTime = now

      const factor = friction ** dt
      state.velocityX *= factor
      state.velocityY *= factor

      if (state.velocityX ** 2 + 
          state.velocityY ** 2 < velocityThresholdSq)
      {
        clearDecayAnim()
        restoreOriginalStyles()
        return
      }

      applyRotationFromVelocity(dt)
      updateTransform()
      state.animFrameId = requestAnimationFrame(tick)
    }

    state.animFrameId = requestAnimationFrame(tick)
  }

  // -------------------- 拖拽帧节流 --------------------

  /**
   * 请求下一帧更新 transform（拖拽期间使用）
   * - 利用 needsUpdate 标记确保同一帧内只发起一次 rAF
   * - 回调中重置标记，允许下一帧再次请求
   */
  function scheduleDragUpdate(): void {
    if (!state.needsUpdate) {
      state.needsUpdate = true
      state.dragRafId = requestAnimationFrame(() => {
        state.needsUpdate = false
        state.dragRafId = 0
        if (!oElement) return
        updateTransform()
      })
    }
  }

  /** 清除拖拽节流的 rAF */
  function cancelDragUpdate(): void {
    if (state.dragRafId) {
      cancelAnimationFrame(state.dragRafId)
      state.needsUpdate = false
      state.dragRafId = 0
    }
  }

  // -------------------- 事件处理器 --------------------

  /** 绑定全局事件（移动、抬起、离开、窗口失焦） */
  function bindEvents(): void {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseleave', onMouseUp)
    window.addEventListener('blur', onMouseUp)
  }

  /** 移除所有绑定的全局事件 */
  function removeEvents(): void {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('mouseleave', onMouseUp)
    window.removeEventListener('blur', onMouseUp)
  }

  /**
   * 处理鼠标按下（仅左键）
   * - 停止任何进行中的惯性动画
   * - 清除待处理的拖拽帧
   * - 记录起始坐标与时间，绑定全局事件
   */
  function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return

    // 停止惯性动画并恢复样式
    if (state.animFrameId) {
      clearDecayAnim()
      restoreOriginalStyles()
    }

    // 清除可能残留的拖拽帧请求
    cancelDragUpdate()

    e.preventDefault()
    updateLastMoveTime()
    updateCoords(e)
    bindEvents()
  }

  /**
   * 处理鼠标移动
   * - 未拖拽时：若移动距离超过阈值，进入拖拽状态
   * - 拖拽中：更新速度、累加角度，并调度帧节流更新
   */
  function onMouseMove(e: MouseEvent): void {
    state.deltaX = e.clientX - state.lastClientX
    state.deltaY = e.clientY - state.lastClientY

    // 使用平方和与阈值平方比较，避免开方运算
    if (!state.isDragging &&
        state.deltaX ** 2 + 
        state.deltaY ** 2 < dragThresholdSq)
    {
      return
    }

    // 首次超过阈值: 进入拖拽状态
    if (!state.isDragging) {
      applyDragStyles()     // 应用拖拽样式（禁用 transition 等）
      updateLastMoveTime()
      updateCoords(e)
      state.velocityX = 0
      state.velocityY = 0
      state.isDragging = true
      scheduleDragUpdate()  // 立即请求一帧渲染，确保样式变更生效
      return
    }

    // 拖拽中：更新坐标、计算速度、累加角度并调度帧更新
    updateCoords(e)
    updateVelocityXY()
    updateLastMoveTime()
    applyRotationFromDelta()          // 累加旋转角度
    scheduleDragUpdate()              // 请求下一帧渲染（已内置节流）
  }

  /**
   * 处理鼠标抬起（或 mouseleave / blur）
   * - 立即移除全局事件，杜绝松手后的意外移动干扰
   * - 取消待处理的拖拽帧
   * - 若处于拖拽状态，启动惯性动画
   */
  function onMouseUp(): void {

    removeEvents()        // 先移除监听，杜绝松手后移动干扰
    cancelDragUpdate()    // 清除待处理的拖拽帧

    if (state.isDragging) {
      startDecayAnim()
      state.isDragging = false
    }
  }

  // -------------------- 初始化与销毁 --------------------

  /** 初始化：验证元素有效性，保存原始样式，绑定 mousedown 事件 */
  function init(): void {
    if (!oElement || !(oElement instanceof HTMLElement)) {
      console.warn('[Drag3d] Invalid oElement')
      return
    }

    saveOriginalStylesToState()
    if (isDrag) {
      document.addEventListener('mousedown', onMouseDown)
    }
  }

  /**
   * 销毁实例，彻底清理所有资源
   * - 强制结束当前拖拽
   * - 取消所有动画帧并恢复样式
   * - 移除事件监听
   */
  function destroy(): void {
    if (state.isDragging) onMouseUp()
    if (state.animFrameId) {
      clearDecayAnim()
      restoreOriginalStyles()
    }
    document.removeEventListener('mousedown', onMouseDown)
  }

  init()

  return { destroy }
}