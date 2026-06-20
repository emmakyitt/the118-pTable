import type { Matrix3d } from '@/infrastructure/typings/matrixTools';
import type { IElementBasic } from '@/assets/data/typings/elements';
import type { LayoutStyle } from '@/domain/typings/viewModels';

/**
 * 视图模式上下文（ViewModeContext）的类型定义
 * 用于在组件树中共享视图布局、卡片数据、选中状态及 3D 变换矩阵等相关状态与操作函数
 */
export interface ViewModeContextType {

  /**
   * 当前视图布局模式（如表格、球形、螺旋等）
   */
  layoutStyle: LayoutStyle;

  /**
   * 元素基础数据列表（卡片数据数组）
   */
  elementsData: IElementBasic[];

  /**
   * 当前被选中的卡片元素 ID
   */
  sectedElement: number;

  /**
   * 每个卡片的独立 3D 变换矩阵数组，顺序与 elementsData 对应
   */
  cardsMatrix3d: Matrix3d[];

  /**
   * 整个卡片容器（父级包裹层）的 3D 变换矩阵
   * 用于整体位移、旋转、缩放等
   */
  cardsWrapMatrix3d: Matrix3d;

  /**
   * 更新布局样式
   * @param layoutStyle - 新的布局模式
   * @returns void 无返回值
   */
  updateLayout: (layoutStyle: LayoutStyle) => void;

  /**
   * 更新被选中的卡片元素 ID
   * @param elemendId - 要选中的卡片 ID
   * @returns void 无返回值
   */
  setSectedElement: (elemendId: number) => void;

  /**
   * 更新所有卡片的 3D 变换矩阵
   * @param matrix3ds - 与卡片数据长度一致的矩阵数组
   * @returns void 无返回值
   */
  setCardsMatrix3d: (matrix3ds: Matrix3d[]) => void

  /**
   * 更新卡片容器的整体 3D 变换矩阵
   * @param matrix3d - 新的容器变换矩阵
   * @returns void 无返回值
   */
  setCardsWrapMatrix3d: (matrix3d: Matrix3d) => void;
}
