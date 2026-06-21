import { useState, type Dispatch, type SetStateAction } from 'react'
import { LayoutStyle } from '@/domain/typings/viewModels';
import { ViewModelService } from '@/domain/services/ViewModelService';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';

/**
 * 该 Hook 根据传入的布局样式，通过 ViewModelService 生成初始的单个 3D 矩阵（而非数组），
 * 并返回一个状态元组，包含当前矩阵对象和更新该状态的函数
 * 
 * 与 useCardsMatrix3d 不同，此 Hook 返回的是单个 Matrix3d，适用于整个卡片容器的变换矩阵
 * 
 * @param layoutStyle - 布局样式，用于决定如何生成卡片容器的矩阵数据
 * @returns 一个元组：
 *          - 第一个元素是 Matrix3d 对象，表示当前卡片容器的 3D 矩阵状态
 *          - 第二个元素是状态更新函数，用于替换整个矩阵对象
 * 
 * 注意：这里使用了 useState 的惰性初始化，确保矩阵数据仅在首次渲染时计算一次，
 * 避免每次渲染都重新调用 ViewModelService.getCardsWrapMatrix3d 造成性能开销
 */
export function useCardsWrapMatrix3d(layoutStyle: LayoutStyle): [Matrix3d, Dispatch<SetStateAction<Matrix3d>>] {
  return useState(() => ViewModelService.getCardsWrapMatrix3d(layoutStyle, 0));
}