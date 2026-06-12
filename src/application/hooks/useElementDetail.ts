import { useMemo } from 'react';
import { ElementService } from '@/domain/services/ElementService';
import type { IElementBasic } from '@/assets/data/typings/elements';

/**
 * 根据原子序数 id 获取元素完整信息
 *
 * @param id - 元素的原子序数
 * @returns 对应元素的基础信息对象；
 */
export function useElementDetail(id: number): IElementBasic | null {
  return useMemo(() => ElementService.getById(id), [id]);
}