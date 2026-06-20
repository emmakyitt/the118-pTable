import { ViewModelFactory } from '@/domain/viewModels'
import { LayoutStyle } from '@/domain/typings/viewModels';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';

/**
 * 视图模型服务类
 * 
 * 提供静态方法用于获取卡片变换矩阵（每个卡片独立矩阵及容器整体矩阵），
 * 并缓存最近一次计算的所有卡片矩阵，便于后续复用或调试
 */
export class ViewModelService {
  /**
   * 缓存最近一次计算的所有卡片独立 3D 变换矩阵
   * 
   * 在调用 getCardsMatrix3d 时会被更新，可用于避免重复计算或作为状态快照
   * 
   * @type {Matrix3d[]}
   */
  static lastCardsMatrix3d: Matrix3d[];

  /**
   * 根据指定的布局样式计算所有卡片的独立 3D 变换矩阵
   * 
   * 该方法会创建 ViewModelFactory 实例，调用其 calcCardsMatrix3d 方法，
   * 并将结果缓存到静态属性 lastCardsMatrix3d 中，最后返回结果数组。
   * 
   * @param layoutStyle - 布局样式（如表格、球形等），决定矩阵计算逻辑
   * @returns {Matrix3d[]} 每个卡片对应的 3D 变换矩阵数组，顺序与卡片列表一致
   */
  static getCardsMatrix3d(layoutStyle: LayoutStyle): Matrix3d[] {

    // 根据布局样式创建工厂，并计算所有卡片的独立矩阵
    const cardsMatrix3d: Matrix3d[] = new ViewModelFactory(layoutStyle).calcCardsMatrix3d();

    // 将计算结果缓存到静态属性中，供外部或其他方法使用
    ViewModelService.lastCardsMatrix3d = cardsMatrix3d;

    // 返回计算结果
    return cardsMatrix3d;
  }

  /**
   * 根据指定的布局样式和选中的卡片 ID，计算整个卡片容器的 3D 变换矩阵
   * 
   * 该方法用于实现卡片点击后容器整体位移/旋转/缩放等效果，
   * 使得选中卡片移动到视觉焦点位置
   * 
   * @param layoutStyle - 当前布局样式
   * @param elementId - 被选中的卡片 ID（传入 0 通常表示取消选中，恢复初始矩阵）
   * @returns {Matrix3d} 容器整体的 3D 变换矩阵
   */
  static getCardsWrapMatrix3d(layoutStyle: LayoutStyle, elementId: number): Matrix3d {

    // 创建工厂实例并计算容器变换矩阵
    return new ViewModelFactory(layoutStyle).calcCardsWrapMatrix3d(elementId);
  }
}