import { useMemo } from 'react'
import { LayoutStyle } from '@/domain/models/typings'
import { ViewModelFactory } from '@/domain/viewModels'
import type { Matrix3D } from '@/domain/models/typings'

/**
 * 根据给定的需要展示的视图布局模式，生成对应的Matrix3d变换矩阵数组。
 * 如果布局样式无效则返回 null，否则通过 ViewModelFactory 获取模型变换矩阵数据。
 *
 * @param layoutStyle - 布局样式枚举值
 * @returns 对应的 Matrix3D 元素变换数组，若样式无效或获取失败则返回 null
 */
export function useMatrix3dGroup(layoutStyle: LayoutStyle): Matrix3D[] | null {

  /**
   * 检查给定的布局样式是否为有效的 LayoutStyle 枚举成员。
   *
   * @param layoutStyle - 待检查的布局样式
   * @returns 如果是有效枚举值返回 true，否则返回 false
   */
  const isExist = (layoutStyle: LayoutStyle): boolean => {

    for (let key in LayoutStyle) {
      // 比较传入的值是否与枚举中的某个值匹配
      if (layoutStyle === LayoutStyle[key as keyof typeof LayoutStyle]) {
        return true;
      }
    }
    return false;
  };

  return useMemo(() => { // 使用 useMemo 缓存结果，仅在 layoutStyle 变化时重新计算

    // 若传入的布局样式无效，直接返回 null
    if (!isExist(layoutStyle)) return null

    // 创建对应视图模型的 ViewModelFactory 实例并获取 3D 变换矩阵
    return new ViewModelFactory(layoutStyle).getMatrix3d() ?? null;

  }, [layoutStyle])
}