import { useState, type Dispatch, type SetStateAction } from 'react'
import { LayoutStyle } from '@/domain/typings/viewModels';
import { ViewModelService } from '@/domain/services/ViewModelService';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';

/**
 * 该 Hook 根据传入的布局样式，通过 ViewModelService 生成初始的 3D 矩阵数据，
 * 并返回一个状态元组，包含当前矩阵数组和更新该状态的函数。
 * 
 * @param layoutStyle - 布局样式，用于决定如何生成卡片矩阵
 * @returns 一个元组：
 *          - 第一个元素是 Matrix3d 数组，表示当前卡片矩阵状态
 *          - 第二个元素是状态更新函数，用于替换整个矩阵数组
 * 
 * 注意：这里使用了 useState 的惰性初始化，确保矩阵数据仅在首次渲染时计算一次，
 * 避免每次渲染都重新调用 ViewModelService.getCardsMatrix3d 造成性能开销。
 */
export function useCardsMatrix3d(layoutStyle: LayoutStyle): [Matrix3d[], Dispatch<SetStateAction<Matrix3d[]>>] {
  return useState(() => ViewModelService.getCardsMatrix3d(layoutStyle));
}