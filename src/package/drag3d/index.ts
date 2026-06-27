/**
 * @file 3D 拖拽旋转工具
 *
 * 通过监听鼠标拖拽事件实时旋转目标 DOM 元素
 * 支持可配置的拖拽阈值、旋转灵敏度、惯性衰减参数
 * 松手后自动启动基于物理模型的惯性衰减动画
 * 提供 destroy 方法彻底清理所有监听和动画
 * 
 * ==================== 工具结构 ====================
 * 
 * 1. 相关依赖
 * 2. 默认常量
 * 3. 主函数 (Drag3d)
 *    - 状态管理
 *    - 工具函数
 *    - 样式处理
 *    - 动画控制
 *    - 拖拽节流
 *    - 事件处理
 *    - 初始化与销毁
 * 
 */

import type { Drag3dProps, DragState } from './types'
import type { Matrix3d } from '@/infrastructure/typings/matrixTools'
import MatrixTools from '@/infrastructure/utils/MatrixTools'

// ==================== 默认常量 ====================

/**
 * 默认配置值，所有字段均可被外部 config 覆盖
 * 数值经过调优，兼顾灵敏度与操作手感
 */
const DEFAULT_CONFIG = {
  /** 触发拖拽所需的最小鼠标移动距离（像素） */
  dragThreshold: 5,
  /** 惯性停止阈值（像素/秒），速度低于该值时停止动画 */
  velocityThreshold: 5,
  /** 旋转灵敏度（度/像素） */
  rotationSensitivity: 0.1,
  /** 惯性衰减系数 (0,1)，表示每秒速度保留的比例 */
  friction: 0.05,
} as const

// ==================== 主函数 ====================

/**
 * 创建 3D 拖拽控制器
 *
 * 工作流程：
 * 1. 左键按下（仅限目标元素内部且拖拽已启用）→ 记录起点，绑定事件
 * 2. 鼠标移动超过阈值 → 进入拖拽状态，实时旋转
 * 3. 鼠标抬起/离开/窗口失焦 → 结束拖动并启动惯性动画
 * 4. 调用 destroy() 彻底清理所有副作用
 *
 * @param props - 配置参数
 * @param props.draggable - 控制拖拽启用的引用，当前值为真时允许拖拽
 * @param props.target - 待旋转的目标 DOM 元素
 * @param props.config - 可选的自定义配置，将与默认值合并
 * @returns 包含 `destroy` 方法的控制器对象，用于手动销毁实例
 */
export default function Drag3d({
  draggable,
  target,
  config = {},
}: Drag3dProps): { destroy: () => void } {

  // 合并外部配置
  const {
    dragThreshold,
    velocityThreshold,
    rotationSensitivity,
    friction,
  } = { ...DEFAULT_CONFIG, ...config }

  // 预计算阈值的平方，用于快速比较
  const dragThresholdSq = dragThreshold * dragThreshold
  const velocityThresholdSq = velocityThreshold * velocityThreshold

  // ==================== 状态管理 ====================

  /**
   * 拖拽控制器内部状态，以模块化结构组织
   * 包含时间、坐标、运动参数、标志位、动画帧 ID 和原始样式快照
   */
  const state: DragState = {
    times: {
      lastMoveTime: 0,
    },
    coords: {
      lastClientX: 0,
      lastClientY: 0,
    },
    motion: {
      deltaX: 0,
      deltaY: 0,
      rotateX: 0,
      rotateY: 0,
      velocityX: 0,
      velocityY: 0,
    },
    flags: {
      isDragging: false,
      needsUpdate: false,
    },
    rafs: {
      dragRafId: 0,
      inertiaRafId: 0,
    },
    originalStyles: {} as Record<string, string>,
  }

  // ==================== 工具函数 ====================

  // -------------------- 状态更新 --------------------

  /** 
   * 记录当前鼠标坐标，用于计算拖动增量
   * @param e - 鼠标事件对象
   */
  function recordCoords(e: MouseEvent): void {
    state.coords.lastClientX = e.clientX
    state.coords.lastClientY = e.clientY
  }

  /** 
   * 记录当前时间戳，用于后续速度计算
   */
  function recordTimestamp(): void {
    state.times.lastMoveTime = performance.now()
  }

  /** 
   * 重置速度分量为零
   * 在进入拖拽或动画停止时调用
   */
  function resetVelocityXY() {
    state.motion.velocityX = 0
    state.motion.velocityY = 0
  }

  /**
   * 重置状态为初始值
   * 
   */
  function resetState() {
    Object.keys(state).forEach(key => {
      if (key === "originalStyles" ||  key === "flags" || key === "rafs") return

      Object.keys(state[key]).forEach(innerKey => {
          Reflect.set(state[key], innerKey, 0);
      })
    })
  }

  /** 
   * 重置运动追踪基准（坐标和时间)，保证最新状态
   * 在拖拽开始或跨越阈值时调用，避免计算累积偏差
   * @param e - 鼠标事件对象
   */
  function resetMotionTracking(e: MouseEvent): void {
    recordTimestamp()
    recordCoords(e)

  }

  // -------------------- 运动计算 --------------------

  /**
   * 计算当前位移速度（像素/秒）
   * 
   * 副作用：更新 state.velocityX / state.velocityY
   * 若时间间隔小于 0.001 秒，为防止除零，速度置零
   *
   * @remarks 速度用于松手后惯性动画的初始动能
   */
  function updateVelocityFromDelta(): void {
    const now = performance.now()
    const dt = (now - state.times.lastMoveTime) / 1000
    state.motion.velocityX = dt > 0.001 ? state.motion.deltaX / dt : 0
    state.motion.velocityY = dt > 0.001 ? state.motion.deltaY / dt : 0
  }

  /**
   * 基于位移增量直接更新旋转角度（拖拽时使用）
   * - 副作用：累加 state.rotateX / state.rotateY
   * - 注意：X 轴旋转对应鼠标垂直移动 (deltaY)，Y 轴旋转对应水平移动 (deltaX)
   */
  function applyRotationFromDelta(): void {
    state.motion.rotateX += state.motion.deltaY * rotationSensitivity
    state.motion.rotateY += state.motion.deltaX * rotationSensitivity
  }

  /**
   * 基于速度和时间差更新旋转角度（惯性动画专用）
   * 
   * 副作用：累加 state.rotateX / state.rotateY
   * 保证帧率无关：速度乘以 dt 得到本帧位移量
   *
   * @param dt - 上一帧到当前帧的时间差（秒）
   */
  function applyRotationFromVelocity(dt: number): void {
    state.motion.rotateX += state.motion.velocityY * rotationSensitivity * dt
    state.motion.rotateY += state.motion.velocityX * rotationSensitivity * dt
  }

  // -------------------- 拖拽状态切换 --------------------

  /**
   * 重置为拖拽前状态
   */
  function resetDrag() {
    if (target.style.transform === state.originalStyles.transform) return
    target.style.transform = state.originalStyles.transform
    restoreOriginalStyles()
    resetState()
  }

  /**
   * 进入拖拽状态：
   * - 设置拖拽标志位
   * - 应用拖拽专用样式（禁用 transition，开启 will-change）
   * - 重置速度分量
   */
  function enterDrag(): void {
    state.flags.isDragging = true
    applyDragStyles()
    resetVelocityXY()
  }

  /**
   * 退出拖拽状态:
   * - 取消拖拽标志
   * - 清除待处理的拖拽帧
   * - 启动惯性衰减动画
   */
  function exitDrag(): void {
    state.flags.isDragging = false
    cancelDragRaf()
    startInertiaAnim()
  }

  // -------------------- UI 渲染 --------------------

  /**
   * 将当前旋转角度叠加到目标元素的原始矩阵上，并通过 style.transform 应用
   * 
   * 算法：先获取元素原始 transform 矩阵，然后左乘当前 rotateX 和 rotateY 的旋转矩阵，
   * 最终得到完整的 matrix3d 字符串
   * 注意：此处直接操作 inline style，且 transition 已被设为 none，故无过渡影响
   */
  function updateTransform(): void {
    if (!target || !document.contains(target)) return
    const originalCssMatrix3d: Matrix3d = parseMatrix3d(state.originalStyles.transform)

    target.style.transform = `matrix3d(${
      MatrixTools.multiplyMatrices([
        MatrixTools.rotateX(state.motion.rotateX),
        MatrixTools.rotateY(state.motion.rotateY),
        originalCssMatrix3d
      ])
    })`
  }

  // ==================== 样式处理 ====================

  /**
   * 解析 CSS `matrix3d(...)` 字符串为 4x4 矩阵
   * 
   * @param str - 包含 matrix3d 的字符串，如 `"matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)"`
   * @returns 4x4 数值矩阵，若字符串不含 matrix3d 或格式错误，返回单位矩阵
   */
  function parseMatrix3d(str: string): Matrix3d {
    const match = str.match(/matrix3d\(([^)]+)\)/)
    if (!match) return MatrixTools.identityMatrix()
    const nums = match[1].split(',').map(Number)
    return Array.from({ length: 4 }, (_, i) => nums!.slice(i * 4, i * 4 + 4)) as Matrix3d
  }

  /**
   * 应用拖拽/动画期间的专用样式
   * - 禁用 transition：避免矩阵更新被过渡动画干扰
   * - 禁用 pointer-events：阻止拖拽期间元素响应鼠标事件，避免误触
   * - 开启 will-change: transform：提前提升合成层，实现 GPU 加速
   */  
  function applyDragStyles(): void {
    if(!target || !document.contains(target)) return
    target.style.transition = 'none'
    target.style.pointerEvents = 'none'
    target.style.willChange = 'transform'
  }

  /**
   * 恢复目标元素到拖拽前的原始样式值
   * 
   * 从 state.originalStyles 中读取并应用 transition、pointerEvents、willChange
   * 不恢复 transform，用户可能还将再次进行拖拽
   */
  function restoreOriginalStyles(): void {
    if(!target || !document.contains(target)) return
    target.style.transition = state.originalStyles.transition
    target.style.pointerEvents = state.originalStyles.pointerEvents
    target.style.willChange = state.originalStyles.willChange
  }

  /**
   * 保存目标元素的原始样式值到状态，用于后续恢复
   * 优先读取 inline style，若无则读取计算后样式
   * 注意：transform 也被保存，作为矩阵叠加的基准矩阵
   */
  function captureOriginalStyles(): void {
    state.originalStyles = {
      pointerEvents: target.style.pointerEvents || window.getComputedStyle(target).pointerEvents,
      transition: target.style.transition || window.getComputedStyle(target).transition,
      willChange: target.style.willChange || window.getComputedStyle(target).willChange,
      transform: target.style.transform || window.getComputedStyle(target).transform,
    }
  }

  // ==================== 动画处理 ====================

  /** 
   * 取消惯性动画帧（如果存在）
   */
  function cancelInertiaRaf(): void {
    if (state.rafs.inertiaRafId) {
      cancelAnimationFrame(state.rafs.inertiaRafId)
      state.rafs.inertiaRafId = 0
    }
  }

  /**
   * 启动惯性衰减动画（基于指数衰减模型）
   * - 使用 requestAnimationFrame 驱动，与屏幕刷新同步
   * - 衰减公式：v = v₀ · friction^dt，实现帧率无关
   * - 合速度低于阈值时自动停止并恢复样式
   * 
   * @remarks 动画期间 pointer-events 保持 none，防止用户在旋转时触发 :hover
   */
  function startInertiaAnim(): void {

    cancelInertiaRaf() // 防止多帧并存

    let lastTime = performance.now()

    /**
     * 每帧动画逻辑 (衰减速度)
     * - 计算时间差 dt（上限 100ms 防止跳帧过大）
     * - 若速度低于阈值，停止动画并恢复样式
     *
     * @param now - 当前帧时间戳（由 rAF 传入）
     */
    function tick(now: number) {
      if (!target || !document.contains(target)) {
          cancelInertiaRaf()
          restoreOriginalStyles()
          return
      }

      const dt = Math.min(now - lastTime, 100) / 1000
      lastTime = now

      const factor = friction ** dt
      state.motion.velocityX *= factor
      state.motion.velocityY *= factor

      if (state.motion.velocityX ** 2 + 
          state.motion.velocityY ** 2 < velocityThresholdSq)
      {
        cancelInertiaRaf()
        restoreOriginalStyles()
        return
      }

      applyRotationFromVelocity(dt)
      updateTransform()
      state.rafs.inertiaRafId = requestAnimationFrame(tick)
    }

    state.rafs.inertiaRafId = requestAnimationFrame(tick)
  }

  // ==================== 拖拽节流 ====================

  /**
   * 请求下一帧更新 transform（拖拽期间使用）
   * 
   * - 利用 `needsUpdate` 标志确保同一帧内只发起一次 rAF
   * - 回调中重置标志，允许下一帧再次请求
   * - 实现按帧更新，避免高频 mousemove 触发过多 DOM 操作
   */
  function scheduleDragUpdate(): void {
    if (!state.flags.needsUpdate) {
      state.flags.needsUpdate = true
      state.rafs.dragRafId = requestAnimationFrame(() => {
        state.flags.needsUpdate = false
        state.rafs.dragRafId = 0
        if (!target) return
        updateTransform()
      })
    }
  }

  /**
   * 取消拖拽节流的 rAF（如果存在）
   * 通常在退出拖拽或销毁时调用
   */
  function cancelDragRaf(): void {
    if (state.rafs.dragRafId) {
      cancelAnimationFrame(state.rafs.dragRafId)
      state.flags.needsUpdate = false
      state.rafs.dragRafId = 0
    }
  }

  // ==================== 事件处理 ====================

  /** 
   * 绑定全局事件（移动、抬起、离开、窗口失焦）
   * 这些事件用于追踪拖拽过程和终止拖拽
   */
  function bindEvents(): void {
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseleave', onMouseUp)
    window.addEventListener('blur', onMouseUp)
  }

  /**
   * 移除所有通过 bindEvents 绑定的全局事件
   */
  function removeEvents(): void {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('mouseleave', onMouseUp)
    window.removeEventListener('blur', onMouseUp)
  }

  /**
   * 处理鼠标按下事件（仅左键、且拖拽已启用）
   * 
   * 操作：
   * - 停止任何进行中的惯性动画并恢复样式
   * - 清除可能残留的拖拽帧
   * - 记录起始坐标与时间，绑定全局事件以启动拖拽流程
   *
   * @param e - 鼠标事件对象
   */
  function onMouseDown(e: MouseEvent): void {

    // 只响应左键、拖拽被禁用（例如有被选中元素时）
    if (e.button !== 0 || !draggable.current) return

    // 停止惯性动画并恢复元素初始样式
    if (state.rafs.inertiaRafId) {
      cancelInertiaRaf()
      restoreOriginalStyles()
    }

    // 清除可能残留的拖拽帧请求
    cancelDragRaf()

    e.preventDefault()
    resetMotionTracking(e)
    bindEvents()
  }

  /**
   * 处理鼠标移动事件
   * 
   * 逻辑：
   * - 计算位移增量
   * - 若未在拖拽状态且位移小于阈值，忽略
   * - 首次超过阈值时，重置运动追踪并进入拖拽
   * - 拖拽中：累加旋转角度、请求渲染、更新速度、更新追踪基准
   *
   * @param e - 鼠标事件对象
   */
  function onMouseMove(e: MouseEvent): void {
    state.motion.deltaX = e.clientX - state.coords.lastClientX
    state.motion.deltaY = e.clientY - state.coords.lastClientY

    // 使用平方和与阈值平方比较，避免开方运算
    if (!state.flags.isDragging &&
        state.motion.deltaX ** 2 + 
        state.motion.deltaY ** 2 < dragThresholdSq)
    {
      return
    }

    // 首次超过阈值: 进入拖拽状态
    if (!state.flags.isDragging) {
      resetMotionTracking(e)
      enterDrag()
      return
    }

    applyRotationFromDelta()          // 累加旋转角度
    scheduleDragUpdate()              // 请求下一帧渲染（已内置节流）

    updateVelocityFromDelta()
    resetMotionTracking(e)
  }

  /**
   * 处理鼠标抬起（或 mouseleave / blur）
   * - 立即移除全局事件，杜绝松手后的意外移动干扰
   * - 若处于拖拽状态，则退出拖拽并启动惯性动画
   */
  function onMouseUp(): void {

    removeEvents()

    if (state.flags.isDragging) {
      exitDrag()
      return
    }

    resetDrag()
  }

  // ==================== 初始化与销毁 ====================

  /**
   * 初始化拖拽控制器：
   * - 验证目标元素是否为有效 HTMLElement
   * - 保存原始样式快照
   * - 在 document 上注册 mousedown 监听
   */
  function init(): void {
    if (!target || !(target instanceof HTMLElement)) {
      console.warn('[Drag3d] Invalid target element')
      return
    }

    captureOriginalStyles()
    document.addEventListener('mousedown', onMouseDown)
  }

  /**
   * 销毁实例，彻底清理所有资源：
   * - 移除所有全局事件监听
   * - 取消拖拽帧与惯性动画帧
   * - 恢复元素原始样式
   * - 移除 mousedown 监听
   */
  function destroy(): void {
    removeEvents()
    cancelDragRaf()
    cancelInertiaRaf()
    restoreOriginalStyles()
    document.removeEventListener('mousedown', onMouseDown) 
  }

  init()

  return { destroy }
}