import { useEffect, useRef } from 'react';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';
import type { LayoutStyle } from '@/domain/typings/viewModels';
import Drag3d from '@/package/drag3d';

/**
 * useDrag3d 钩子的配置参数
 */
interface UseDrag3dOptions {
  /** 是否启用拖拽旋转功能 */
  isDrag: boolean;
  /** 目标 DOM 元素，未获取到时为 null */
  element: HTMLElement | null;
  /** 当前布局样式，用于触发重新初始化，比如原始位置变化时 */
  layoutStyle: LayoutStyle;
  /**
   * 根据 X/Y 轴的旋转角度生成 matrix3d 字符串
   * @param rotateX 绕 X 轴旋转角度（度）
   * @param rotateY 绕 Y 轴旋转角度（度）
   * @returns [Matrix3d] CSS matrix3d 
   */
  getMatrix3d: (rotateX: number, rotateY: number) => Matrix3d;
  /**
   * 可选的拖拽行为配置，会直接透传给 Drag3d 工具
   * 类型与 Drag3d 函数的 config 参数一致
   */
  config?: Parameters<typeof Drag3d>[0]['config'];
}

/**
 * 自定义 React Hook：将 Drag3d 拖拽旋转逻辑桥接到 React 组件生命周期中
 *
 * 使用方式：
 * - 传入需要启用拖拽功能的目标DOM元素、是否启用拖拽的开关、布局样式以及getMatrix3d函数
 * - 内部通过 useEffect 管理 Drag3d 实例的创建与销毁，并在依赖项变化时重建实例
 * - 使用 ref 保持 getMatrix3d 的最新引用，避免因函数重建导致不必要的实例重建
 *
 * @param options - 配置选项
 */
export function useDrag3d({
  isDrag,
  element,
  layoutStyle,
  getMatrix3d,
  config,
}: UseDrag3dOptions) {
  // 始终保持 getMatrix3d 的最新值，避免因函数引用变化而触发不必要的 useEffect 重新执行
  const getMatrix3dRef = useRef(getMatrix3d);
  getMatrix3dRef.current = getMatrix3d;

  useEffect(() => {
    
    // 元素尚未挂载或不存在时，不创建实例
    if (!element) return;

    // 创建 Drag3d 实例，注入当前最新引用和配置
    const instance = Drag3d({
      isDrag,
      oElement: element,
      setMatrix3d: (x, y) => getMatrix3dRef.current(x, y),
      config, // 透传外部配置
    });

    // 清理函数：在依赖变化或组件卸载时销毁实例，移除事件监听及定时器
    return () => {
      instance.destroy();
    };
  }, [isDrag, element, layoutStyle, config]); // 当关键状态变化时重建实例
}