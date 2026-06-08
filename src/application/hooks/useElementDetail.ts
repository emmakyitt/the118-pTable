import { useMemo } from 'react'
import { ElementService, type ElementBasic } from '@/domain/services/ElementService'

/**
 * 根据原子序数 id 获取元素完整信息
 *
 * @param id - 元素的原子序数，传入 `null` 时返回 `null`
 * @returns 对应元素的基础信息对象；若 id 为 `null` 或未找到对应元素，则返回 `null`
 */
export function useElementDetail(id: number | null): ElementBasic | null {
  return useMemo(() => {
    if (id === null) return null
    return ElementService.getById(id) ?? null
  }, [id])
}