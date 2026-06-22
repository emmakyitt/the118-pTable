// src/domain/animation/Drag3DAnim.tsx
import React, { useMemo } from 'react';
import type { Matrix } from '@/infrastructure/typings/matrixTools';
import { useViewMode } from '@/application/hooks/useViewMode';
import { useInteraction } from '@/application/hooks/useInteraction';
import { LayoutStyle } from '@/domain/typings/viewModels';
import { useDrag3d } from '@/application/hooks/useDrag3d';
import MatrixTools from '@/infrastructure/utils/MatrixTools';

interface Drag3DAnimProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  target: React.RefObject<HTMLElement | null>;
  /** 可选：覆盖 Drag3d 的行为参数 */
  dragConfig?: Parameters<typeof useDrag3d>[0]['config'];
}

export default function Drag3DAnim({
  className,
  children,
  target,
  style,
  dragConfig,
}: Drag3DAnimProps) {

  const { layoutStyle } = useViewMode();
  const { sectedElement } = useInteraction(); // 修正拼写

  const scaleArgs: Matrix = useMemo(() => {
    switch (layoutStyle) {
      case LayoutStyle.SPH:
        return [0.6, 0.6, 1, 2];
      case LayoutStyle.HEL:
        return [0.8, 0.8, 1, 2];
      default:
        return [1, 1, 1, 2];
    }
  }, [layoutStyle]);

  const getMatrix3d = useMemo(
    () => (rotateX: number, rotateY: number) =>
      MatrixTools.multiplyMatrices([
        MatrixTools.rotateX(rotateX),
        MatrixTools.rotateY(rotateY),
        MatrixTools.scale(scaleArgs),
      ]),
    [scaleArgs]
  );

  useDrag3d({
    isDrag: !sectedElement,
    element: target.current,
    config: dragConfig, // 传递外部配置
    layoutStyle,
    getMatrix3d,
  });

  return (
    <div
      className={className}
      style={{ transformStyle: 'preserve-3d', ...style }}
    >
      {children}
    </div>
  );
}