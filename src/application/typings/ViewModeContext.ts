import type { Matrix3d } from '@/infrastructure/typings/matrixTools';
import type { IElementBasic } from '@/assets/data/typings/elements';
import type { LayoutStyle } from '@/domain/typings/viewModels';

export interface ViewModeContextType {

  /** 当前视图布局模式 */
  layoutStyle: LayoutStyle;

  /** 设置布局样式函数 */ 
  setLayoutStyle: (layoutStyle: LayoutStyle) => void;

  /** 元素基础数据列表 */
  elementsData: IElementBasic[] | null;

  /** 变换矩阵数组数据 */
  cardsMatrix3d: Matrix3d[] | null;
}
