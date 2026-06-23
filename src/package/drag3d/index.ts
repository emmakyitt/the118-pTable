import type { Matrix3d } from '@/infrastructure/typings/matrixTools';

/**
 * @file 3D 拖拽旋转工具
 * 通过监听鼠标拖拽事件实时旋转目标 DOM 元素，
 * 并支持惯性衰减动画
 */

// -------------------- 类型定义 --------------------

/**
 * 可选的拖拽行为配置，用于覆写默认常量
 * 所有字段均为可选，未提供时使用内部默认值
 */
interface Drag3dConfig {
  /** 触发拖拽旋转的最小移动距离（像素），防止微小抖动 */
  dragThreshold?: number;
  /** 旋转灵敏度，单位：度/像素，数值越大旋转越快 */
  rotationSensitivity?: number;
  /** 惯性衰减动画的更新间隔（毫秒） */
  decayInterval?: number;
  /** 惯性衰减因子，范围 0~1，值越小衰减越快（每帧乘以此因子） */
  decayFactor?: number;
  /** 惯性动画停止阈值，当每帧位移像素小于该值时停止动画 */
  decayStopThreshold?: number;
}

/**
 * Drag3d 主函数的参数接口
 */
interface Drag3dProps {
  /** 拖拽事件启用状态，为 false 时不会绑定任何事件 */
  isDrag: boolean;
  /** 需要应用旋转拖拽的目标 DOM 元素 */
  oElement: HTMLElement;
  /**
   * 角度到 matrix3d 的转换函数
   * @param v1 当前绕 X 轴的累计旋转角度（度）
   * @param v2 当前绕 Y 轴的累计旋转角度（度）
   * @returns 可用于 CSS transform matrix3d 的  Matrix3d类型
   */
  setMatrix3d: (v1: number, v2: number) => Matrix3d;
  /** 外部可选的拖拽行为配置，缺省字段使用模块默认值 */
  config?: Drag3dConfig;
}

// -------------------- 默认常量 --------------------

/**
 * 所有可配置项的默认值。
 */
const DEFAULT_CONFIG = {
  dragThreshold: 10,
  rotationSensitivity: 0.1,
  decayInterval: 10,
  decayFactor: 0.95,
  decayStopThreshold: 0.05,
} as const;

// -------------------- 主函数 --------------------

/**
 * 初始化 3D 拖拽旋转功能，为目标元素绑定鼠标事件
 *
 * 行为说明：
 * 1. 鼠标按下后记录初始坐标，并在 document 上监听移动和抬起事件
 * 2. 移动距离超过阈值后进入拖拽状态，实时计算角度增量并更新元素 transform
 * 3. 鼠标抬起后，若曾进入拖拽状态，则启动惯性衰减动画，使旋转逐渐停止
 * 4. 调用返回的 `destroy` 方法可移除所有事件监听与定时器，恢复元素的默认过渡属性
 *
 * @param props - 配置参数
 * @returns 包含 `destroy` 方法的对象，用于手动销毁实例
 */
export default function Drag3d({
  isDrag,
  oElement,
  setMatrix3d,
  config = {},
}: Drag3dProps): { destroy: () => void } {

  // 合并默认值与外部配置，外部配置优先级更高
  const {
    dragThreshold,
    rotationSensitivity,
    decayInterval,
    decayFactor,
    decayStopThreshold,
  } = { ...DEFAULT_CONFIG, ...config };

  // -------------------- 内部状态 --------------------

  /**
   * 模块运行时状态，集中管理避免散落变量
   */
  const state = {
    deltaX: 0,                    // 当前帧 X 方向位移增量（像素）
    deltaY: 0,                    // 当前帧 Y 方向位移增量（像素）
    rotateX: 0,                   // 绕 X 轴的累计旋转角度（度）
    rotateY: 0,                   // 绕 Y 轴的累计旋转角度（度）
    animTimer: 0,                 // 惯性动画定时器 ID，0 表示无定时器
    oldClientX: 0,                // 上一次鼠标事件的 clientX 坐标值
    oldClientY: 0,                // 上一次鼠标事件的 clientY 坐标值
    isDragging: false,            // 是否已进入拖拽状态（位移超过阈值后置 true）
    oElementTransition: '',       // 目标DOM元素的默认 CSS transition 值，用于销毁时恢复
  };

  // -------------------- 工具函数 --------------------

  /**
   * 根据当前帧位移增量更新累计旋转角度
   * 此函数会修改 state.rotateX 与 state.rotateY
   * @returns 最新的 [rotateX, rotateY] 角度数组
   */
  function applyRotation(): [number, number] {
    state.rotateX += state.deltaY * rotationSensitivity;
    state.rotateY += state.deltaX * rotationSensitivity;
    return [state.rotateX, state.rotateY];
  }

  /**
   * 更新目标 DOM 元素的 Transform matrix3d 内联样式值
   * 
   * 将应用角度给到 setMatrix3d 函数, 该函数由外部传入;
   * 通过外部的必要计算得到一个Matrix3d 类型的值，并应用到元素上
   * 
   * @param angles - [rotateX, rotateY] 角度对
   */
  function updateTransform(angles: [number, number]): void {
    if (!oElement) return;
    oElement.style.transform = `matrix3d(${setMatrix3d(angles[0], angles[1])})`;
  }

  /**
   * 禁用元素的 CSS transition，确保拖拽/惯性期间无过渡动画干扰
   */
  function disableTransition(): void {
    if (oElement && oElement.style.transition !== 'none') {
      oElement.style.transition = 'none';
    }
  }

  /**
   * 恢复元素的原始 CSS transition 属性
   */
  function enableTransition(): void {
    if (oElement) {
      oElement.style.transition = state.oElementTransition;
    }
  }

  /**
   * 清除惯性衰减动画定时器
   */
  function clearDecayAnim(): void {
    if (state.animTimer) {
      clearInterval(state.animTimer);
      state.animTimer = 0;
    }
  }

  /**
   * 启动惯性衰减动画
   * 每帧将位移乘以衰减因子，直到位移小于停止阈值，然后恢复过渡并清除定时器
   */
  function startDecayAnim(): void {
    clearDecayAnim();

    state.animTimer = window.setInterval(() => {
      state.deltaX *= decayFactor;
      state.deltaY *= decayFactor;

      if (
        Math.abs(state.deltaX) < decayStopThreshold &&
        Math.abs(state.deltaY) < decayStopThreshold
      ) {
        clearDecayAnim();
        enableTransition();
        return;
      }

      disableTransition();
      updateTransform(applyRotation());
    }, decayInterval);
  }

  /**
   * 更新上一次记录的鼠标坐标值
   * @param e - 鼠标事件对象
   */
  function updateCoords(e: MouseEvent): void {
    state.oldClientX = e.clientX;
    state.oldClientY = e.clientY;
  }

  // -------------------- 事件处理器 --------------------

  /**
   * 鼠标按下事件处理器
   * 阻止默认行为（如文本选择），清除可能正在进行的惯性动画，
   * 记录坐标，并在 document 上注册移动和抬起的事件监听
   */
  function onMouseDown(e: MouseEvent): void {

    // 忽略右键/中键 (仅为鼠标左键绑定拖拽事件)
    if (e.button !== 0) return;

    e.preventDefault();
    clearDecayAnim();
    updateCoords(e);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * 鼠标移动事件处理器
   * 计算位移；若未达到阈值则忽略
   * 首次超过阈值时进入拖拽状态，清除动画并禁用过渡, 并记录当前鼠标坐标值
   * 拖拽状态下持续更新坐标并实时旋转元素
   */
  function onMouseMove(e: MouseEvent): void {
    state.deltaX = e.clientX - state.oldClientX;
    state.deltaY = e.clientY - state.oldClientY;

    if (Math.hypot(state.deltaX, state.deltaY) < dragThreshold) return;

    if (!state.isDragging) {
      clearDecayAnim();
      disableTransition();
      updateCoords(e);
      state.isDragging = true;
      return;
    }

    updateCoords(e);
    clearDecayAnim();
    updateTransform(applyRotation());
  }

  /**
   * 鼠标抬起事件处理器
   * 移除 document 上的移动和抬起监听
   * 若之前处于拖拽状态，则启动惯性动画，并重置拖拽标志
   */
  function onMouseUp(): void {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (state.isDragging) startDecayAnim();
    state.isDragging = false;
  }

  // -------------------- 初始化与销毁 --------------------

  /**
   * 拖拽工具初始化
   * 校验元素有效性;
   * 保存目标DOM元素的原始 transition; 优先读取内联样式
   * 并根据 isDrag 状态决定是否为目标DOM元素启用拖拽功能
   */
  function init(): void {
    if (!oElement || !(oElement instanceof HTMLElement)) {
      console.warn('[Drag3d] Invalid oElement');
      return;
    }
    state.oElementTransition = oElement.style.transition || window.getComputedStyle(oElement).transition;
    if (isDrag) document.addEventListener('mousedown', onMouseDown);
  }

  /**
   * 销毁实例，清除所有副作用：
   * - 若正在拖拽，模拟 mouseup 结束拖拽
   * - 移除 mousedown 监听
   * - 清除惯性动画定时器
   * - 恢复元素的原始 transition
   */
  function destroy(): void {
    if (state.isDragging) onMouseUp();
    document.removeEventListener('mousedown', onMouseDown);
    clearDecayAnim();
    if (oElement) enableTransition();
  }

  init();
  return { destroy };
}