import { useEffect, useRef } from 'react';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';
import type { LayoutStyle } from '@/domain/typings/viewModels';
import Drag3d from '@/package/drag3d';

interface UseDrag3dOptions {
  isDrag: boolean;
  element: HTMLElement | null;
  layoutStyle: LayoutStyle;
  getMatrix3d: (rotateX: number, rotateY: number) => Matrix3d;
  /** 可选配置，将透传给 Drag3d */
  config?: Parameters<typeof Drag3d>[0]['config'];
}

export function useDrag3d({
  isDrag,
  element,
  layoutStyle,
  getMatrix3d,
  config,
}: UseDrag3dOptions) {
  const getMatrix3dRef = useRef(getMatrix3d);
  getMatrix3dRef.current = getMatrix3d;

  useEffect(() => {
    if (!element) return;

    const instance = Drag3d({
      isDrag,
      oElement: element,
      setMatrix3d: (x, y) => getMatrix3dRef.current(x, y),
      config, // 传递配置
    });

    return () => {
      instance.destroy();
    };
  }, [isDrag, element, layoutStyle, config]);
}