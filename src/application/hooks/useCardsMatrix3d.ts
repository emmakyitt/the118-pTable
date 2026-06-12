import { useMemo } from 'react'
import { LayoutStyle } from '@/domain/typings/viewModels';
import { ViewModelService } from '@/domain/services/ViewModelService';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';

/**
 * 根据给定的需要展示的视图布局模式，生成对应卡片元素的Matrix3d变换矩阵数组。
 * 如果若视图模型无效则返回 null，否则通过 ViewModelFactory 获取模型变换矩阵数据。
 *
 * @param layoutStyle - 布局样式枚举值
 * @returns Matrix3d[] 卡片元素变换矩阵，若视图模型不存在或获取失败则返回 null
 */

  /** 获取卡片元素变换矩阵数据 */
export function useCardsMatrix3d(layoutStyle: LayoutStyle): Matrix3d[] | null {
  // 使用 useMemo 缓存结果，仅在 layoutStyle 变化时重新计算
  return useMemo(() => ViewModelService.getCardsMatrix3d(layoutStyle), [layoutStyle]);
}