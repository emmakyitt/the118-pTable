import type { Matrix3d } from '@/infrastructure/typings/matrixTools';

// -------------------- 类型定义 --------------------

/**
 * 可选配置，用于覆写默认行为常量
 */
interface Drag3dConfig {
  /** 触发拖拽的最小移动距离（px） */
  dragThreshold?: number;
  /** 旋转灵敏度（度/像素） */
  rotationSensitivity?: number;
  /** 惯性衰减动画更新间隔（ms） */
  decayInterval?: number;
  /** 惯性衰减因子（0~1） */
  decayFactor?: number;
  /** 惯性停止阈值（像素/帧） */
  decayStopThreshold?: number;
}

interface Drag3dProps {
  /** 是否启用拖拽，为 false 时不会绑定事件 */
  isDrag: boolean;
  /** 目标 DOM 元素 */
  oElement: HTMLElement;
  /** 根据角度生成 matrix3d 字符串 */
  setMatrix3d: (v1: number, v2: number) => Matrix3d;
  /** 可选的行为配置 */
  config?: Drag3dConfig;
}

// -------------------- 默认常量 --------------------

const DEFAULT_CONFIG = {
  dragThreshold: 10,
  rotationSensitivity: 0.1,
  decayInterval: 10,
  decayFactor: 0.95,
  decayStopThreshold: 0.05,
} as const;

// -------------------- 主函数 --------------------

export default function Drag3d({
  isDrag,
  oElement,
  setMatrix3d,
  config = {},
}: Drag3dProps): { destroy: () => void } {
  // 合并默认值与外部配置
  const {
    dragThreshold,
    rotationSensitivity,
    decayInterval,
    decayFactor,
    decayStopThreshold,
  } = { ...DEFAULT_CONFIG, ...config };

  // -------------------- 内部状态 --------------------

  const state = {
    deltaX: 0,
    deltaY: 0,
    rotateX: 0,
    rotateY: 0,
    animTimer: 0 as number | 0,
    oldCoordX: 0,
    oldCoordY: 0,
    isDragging: false,
    originalTransition: '',
  };

  // -------------------- 工具函数 --------------------

  function applyRotation(): [number, number] {
    state.rotateX += state.deltaY * rotationSensitivity;
    state.rotateY += state.deltaX * rotationSensitivity;
    return [state.rotateX, state.rotateY];
  }

  function updateTransform(angles: [number, number]): void {
    if (!oElement) return;
    oElement.style.transform = `matrix3d(${setMatrix3d(angles[0], angles[1])})`;
  }

  function disableTransition(): void {
    if (oElement && oElement.style.transition !== 'none') {
      oElement.style.transition = 'none';
    }
  }

  function enableTransition(): void {
    if (oElement) {
      oElement.style.transition = state.originalTransition;
    }
  }

  function clearDecayAnim(): void {
    if (state.animTimer) {
      clearInterval(state.animTimer);
      state.animTimer = 0;
    }
  }

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

  function updateCoords(e: MouseEvent): void {
    state.oldCoordX = e.clientX;
    state.oldCoordY = e.clientY;
  }

  // -------------------- 事件处理器 --------------------

  function onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    clearDecayAnim();
    updateCoords(e);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e: MouseEvent): void {
    state.deltaX = e.clientX - state.oldCoordX;
    state.deltaY = e.clientY - state.oldCoordY;

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

  function onMouseUp(): void {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (state.isDragging) startDecayAnim();
    state.isDragging = false;
  }

  // -------------------- 初始化与销毁 --------------------

  function init(): void {
    if (!oElement || !(oElement instanceof HTMLElement)) {
      console.warn('[Drag3d] Invalid oElement');
      return;
    }
    state.originalTransition = window.getComputedStyle(oElement).transition;
    if (isDrag) document.addEventListener('mousedown', onMouseDown);
  }

  function destroy(): void {
    if (state.isDragging) onMouseUp();
    document.removeEventListener('mousedown', onMouseDown);
    clearDecayAnim();
    if (oElement) enableTransition();
  }

  init();
  return { destroy };
}