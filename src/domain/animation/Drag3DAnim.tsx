import React, { useMemo } from 'react';
import { useViewMode } from '@/application/hooks/useViewMode';
import { useInteraction } from '@/application/hooks/useInteraction';
import { cardsWrapDfltMatix3d } from '@/domain/viewModels';
import { useDrag3d } from '@/application/hooks/useDrag3d';
import MatrixTools from '@/infrastructure/utils/MatrixTools';

/**
 * Drag3DAnim 组件的属性接口
 */
interface Drag3DAnimProps {
  /** 外层容器的 CSS 类名 */
  className?: string;
  /** 子节点 */
  children?: React.ReactNode;
  /** 外层容器的行内样式 */
  style?: React.CSSProperties;
  /** 被拖拽旋转的目标 DOM 元素引用 */
  target: React.RefObject<HTMLElement | null>;
  /**
   * 可选的拖拽行为配置，会直接传递给 useDrag3d 钩子
   * 类型应与 useDrag3d 的 config 参数一致
   */
  dragConfig?: Parameters<typeof useDrag3d>[0]['config'];
}

/**
 * 3D 拖拽动画组件
 *
 * 根据当前布局样式（LayoutStyle）动态计算缩放参数，
 * 构建包含旋转与缩放的 matrix3d 变换函数，
 * 并通过 useDrag3d 钩子启用/禁用目标元素的拖拽旋转。
 *
 * 当用户没有选中任何元素（sectedElement 为 false）时允许拖拽
 * 外层容器固定开启 preserve-3d 以保持子元素的 3D 透视效果
 */
export default function Drag3DAnim({
  className,
  children,
  target,
  style,
  dragConfig,
}: Drag3DAnimProps) {

  // 获取当前布局样式类型
  const { layoutStyle } = useViewMode();

  // 获取当前交互状态，sectedElement 有值时表示有元素被选中
  const { sectedElement } = useInteraction(); 

  /**
   * 生成 Matrix3d 类型值的函数
   * 按顺序叠加旋转变换（绕 X 轴、绕 Y 轴）与缩放变换，
   * 通过矩阵相乘得到最终的 3D 变换矩阵
   * 注意: `rotateX` 和 `rotateY` 由拖拽工具内部提供
   */
  const getMatrix3d = useMemo(
    () => (rotateX: number, rotateY: number) =>
      MatrixTools.multiplyMatrices([
        MatrixTools.rotateX(rotateX),
        MatrixTools.rotateY(rotateY),
        cardsWrapDfltMatix3d[layoutStyle] // 应用目标 DOM 元素原始 Matrix3d 值
      ]),
    [layoutStyle]
  );

  // 绑定拖拽旋转逻辑：当没有元素被选中时启用拖拽
  useDrag3d({
    isDrag: !sectedElement,
    element: target.current,
    config: dragConfig, // 传递外部可选配置
    layoutStyle,
    getMatrix3d,
  });

  return (
    <div
      className={ className }
      style={{ transformStyle: 'preserve-3d', ...style }}
    >
      {children}
    </div>
  );
}