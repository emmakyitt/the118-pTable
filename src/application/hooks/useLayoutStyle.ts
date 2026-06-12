import { useState, type Dispatch, type SetStateAction } from 'react';
import { LayoutStyle } from '@/domain/typings/viewModels';

/**
 * 管理视图模型布局的展示状态
 * 
 * @returns {[LayoutStyle, Dispatch<SetStateAction<LayoutStyle>>]} 
 *   返回一个元组：
 *   - 当前布局模型 (LayoutStyle 枚举)
 *   - 更新布局模型的 setState 函数 (类型安全的 Dispatch)
 */
export function useLayoutStyle (): [LayoutStyle, Dispatch<SetStateAction<LayoutStyle>>] {

  // 当前页面中所展示的布局模型，默认值为 LayoutStyle.TAB (表格视图)
  return useState<LayoutStyle>(LayoutStyle.RAN);
}