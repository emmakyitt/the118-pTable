/**
 * @file 3D 拖拽旋转工具
 *
 * 通过监听鼠标拖拽事件实时旋转目标 DOM 元素
 * 支持可配置的拖拽阈值、旋转灵敏度、惯性衰减参数
 * 松手后自动启动基于物理模型的惯性衰减动画
 * 提供 destroy 方法彻底清理所有监听和动画
 *
 * =================== 主要 Bug 修复说明 ===================
 *
 * Bug 现象:
 *   松手后快速移动鼠标导致惯性动画卡顿、掉帧
 *
 * Bug 成因:
 *   1. 原实现用 setInterval 驱动动画，回调受主线程任务影响
 *      鼠标移动时浏览器内部事件（命中测试、:hover 计算等）占用主线程
 *      导致定时器延迟，帧间隔不均匀
 *   2. 未禁用 pointer-events，移动鼠标触发额外样式计算与重绘
 *   3. 固定帧衰减因子未考虑帧间隔差异，不同刷新率下动画速度不一致
 *
 * 修复措施:
 *   1. 动画循环改用 requestAnimationFrame，与屏幕刷新同步
 *   2. 动画期间将元素 pointer-events 设为 'none'，阻止鼠标事件开销
 *      动画停止或被打断时恢复原始值
 *   3. 基于时间差 (dt) 指数衰减: Math.pow(friction, dt)
 *      实现完全帧率无关的惯性表现
 *   4. onMouseUp 中立即调用 removeEvents()，杜绝松手后 mousemove 回调
 *   5. 增加 mouseleave / window.blur 监听，强制结束拖拽防止状态残留
 *   6. 速度单位从“像素/帧”改为“像素/秒”，调整停止阈值实现精准物理
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

  // -------------------- 内部状态 --------------------

  interface DragState {
    deltaX: number
    deltaY: number
    rotateX: number
    rotateY: number
    velocityX: number
    velocityY: number
    animFrameId: number
    lastClientX: number
    lastClientY: number
    lastMoveTime: number
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
    animFrameId: 0,
    lastClientX: 0,
    lastClientY: 0,
    lastMoveTime: 0,
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
   * 副作用：累加 state.rotateX / state.rotateY
   */
  function applyRotationFromDelta(): number[] {
    state.rotateX += state.deltaY * rotationSensitivity
    state.rotateY += state.deltaX * rotationSensitivity
    return [state.rotateX, state.rotateY]
  }

  /**
   * 基于速度和时间差更新旋转角度（惯性动画专用）
   * 副作用：累加 state.rotateX / state.rotateY
   */
  function applyRotationFromVelocity(dt: number): number[] {
    state.rotateX += state.velocityY * rotationSensitivity * dt
    state.rotateY += state.velocityX * rotationSensitivity * dt
    return [state.rotateX, state.rotateY]
  }

  /** 将角度通过外部回调转化为 matrix3d 并应用到元素上 */
  function updateTransform(angles: number[]): void {
    if (!oElement) return
    oElement.style.transform = `matrix3d(${setMatrix3d(angles[0], angles[1])})`
  }

  // -------------------- 样式处理器 --------------------

  /** 驼峰式 CSS 属性名转连字符格式 */
  function formatCssName(key: string): string {
    return key.replace(/([A-Z])/g, '-$1').toLowerCase()
  }

  /**
   * 禁用 transition 和 pointer-events
   * 拖拽及惯性动画期间使用，消除 CSS 过渡干扰与鼠标事件开销
   */
  function disableOriginalStyles(): void {
    Object.keys(state.originalStyles).forEach((key) => {
      oElement.style.setProperty(formatCssName(key), 'none')
    })
  }

  /** 恢复元素的原始 transition 和 pointer-events */
  function enableOriginalStyles(): void {
    Object.keys(state.originalStyles).forEach((key) => {
      oElement.style.setProperty(formatCssName(key), state.originalStyles[key])
    })
  }

  /** 读取元素 CSS 属性当前值（优先内联样式） */
  function getOriginalStyle(str: string): string {
    const cssName = formatCssName(str)
    return (
      oElement.style.getPropertyValue(cssName) ||
      window.getComputedStyle(oElement).getPropertyValue(cssName)
    )
  }

  /** 保存 transition 和 pointer-events 当前值到状态 */
  function saveOriginalStylesToState(): void {
    state.originalStyles = {
      transition: getOriginalStyle('transition'),
      pointerEvents: getOriginalStyle('pointerEvents'),
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
   * 启动惯性衰减动画
   * 使用 requestAnimationFrame 基于时间差实现帧率无关衰减
   * 动画期间强制禁用 pointer-events 防止干扰
   */
  function startDecayAnim(): void {
    if (!oElement) return
    clearDecayAnim()

    // 防御性禁用，确保动画环境干净
    disableOriginalStyles()

    let lastTime = performance.now()

    /** 动画循环：每帧衰减速度，低于阈值则停止并恢复样式 */
    function tick(now: number) {
      const dt = Math.min(now - lastTime, 100) / 1000
      lastTime = now

      const factor = Math.pow(friction, dt)
      state.velocityX *= factor
      state.velocityY *= factor

      if (Math.hypot(state.velocityX, state.velocityY) < velocityThreshold) {
        clearDecayAnim()
        enableOriginalStyles()
        return
      }

      updateTransform(applyRotationFromVelocity(dt))
      state.animFrameId = requestAnimationFrame(tick)
    }

    state.animFrameId = requestAnimationFrame(tick)
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
   * 停止进行中的动画，记录时间与坐标，绑定后续事件
   */
  function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return

    if (state.animFrameId) {
      clearDecayAnim()
      enableOriginalStyles()
    }

    e.preventDefault()
    updateLastMoveTime()
    updateCoords(e)
    bindEvents()
  }

  /**
   * 处理鼠标移动
   * 计算位移，超过阈值进入拖拽；拖拽中实时计算速度并更新旋转
   */
  function onMouseMove(e: MouseEvent): void {
    state.deltaX = e.clientX - state.lastClientX
    state.deltaY = e.clientY - state.lastClientY

    if (
      !state.isDragging &&
      Math.hypot(state.deltaX, state.deltaY) < dragThreshold
    ) {
      return
    }

    // 首次超过阈值：进入拖拽状态
    if (!state.isDragging) {
      disableOriginalStyles()
      updateLastMoveTime()
      updateCoords(e)
      state.velocityX = 0
      state.velocityY = 0
      state.isDragging = true
      return
    }

    // 拖拽中：更新坐标、速度并应用旋转
    updateCoords(e)
    updateVelocityXY()
    updateLastMoveTime()
    updateTransform(applyRotationFromDelta())
  }

  /**
   * 处理鼠标抬起（或 mouseleave / blur）
   * 立即移除事件监听，若处于拖拽状态则启动惯性动画
   */
  function onMouseUp(): void {
    // 先移除监听，杜绝松手后移动干扰
    removeEvents()

    if (state.isDragging) {
      startDecayAnim()
      state.isDragging = false
    }
  }

  // -------------------- 初始化与销毁 --------------------

  /** 初始化：验证元素、保存样式、绑定 mousedown */
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

  /** 销毁实例：结束拖拽、取消动画、恢复样式、移除监听 */
  function destroy(): void {
    if (state.isDragging) onMouseUp()
    if (state.animFrameId) {
      clearDecayAnim()
      enableOriginalStyles()
    }
    document.removeEventListener('mousedown', onMouseDown)
  }

  init()

  return { destroy }
}