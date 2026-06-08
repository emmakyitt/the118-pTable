import type { ElementBasic } from '@/domain/services/ElementService';
import type { Matrix3D } from '@/domain/models/typings';
import { createContext } from 'react';
import { LayoutStyle } from '@/domain/models/typings';

export interface ViewModeContextType {

  /** 当前视图布局模式 */
  layoutStyle: LayoutStyle;

  /** 设置布局样式函数 */ 
  setLayoutStyle: (layoutStyle: LayoutStyle) => void;

  /** 元素基础数据列表 */
  elementsData: ElementBasic[] | null;

  /** 变换矩阵数组数据 */
  matrix3dGroup: Matrix3D[] | null;
}

/**
 * 视图模式上下文，提供布局模式、元素数据和变换矩阵数组数据
 */
export const ViewModeContext = createContext<ViewModeContextType>({
  layoutStyle: LayoutStyle.TAB,
  setLayoutStyle: () => {},
  elementsData: null,
  matrix3dGroup: null,
})