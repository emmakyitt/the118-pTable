import type { Matrix3d } from '@/infrastructure/typings/matrixTools';
import type { IElementBasic } from '@/assets/data/typings/elements';
import type { LayoutStyle } from '@/domain/typings/viewModels';

export interface ViewModeContextType {

  /** 当前视图布局模式 */
  layoutStyle: LayoutStyle;

  /** 设置布局样式函数 */ 
  updateLayout: (layoutStyle: LayoutStyle) => void;

  /** 元素基础数据列表 */
  elementsData: IElementBasic[] | null;

  /** 每个卡片的独立 3D 变换矩阵数组 */
  cardsMatrix3d: Matrix3d[] | null;

  /** 整个卡片容器的 3D 变换矩阵 */
  cardsWrapMatrix3d: Matrix3d | null;

  /** 更新卡片容器 3D 变换矩阵的函数 */
  setCardsWrapMatrix3d: (matrix3d: Matrix3d) => void;
}
