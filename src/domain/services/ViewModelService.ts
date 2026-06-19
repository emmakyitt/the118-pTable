import { ViewModelFactory } from '@/domain/viewModels'
import { LayoutStyle } from '@/domain/typings/viewModels';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';

/**
 * 根据给定的需要展示的视图布局模式，生成对应卡片元素的Matrix3d变换矩阵数组。
 * 如果若视图模型无效则返回 null，否则通过 ViewModelFactory 获取模型变换矩阵数据。
 *
 * @param layoutStyle - 布局样式枚举值
 * @returns Matrix3d[] 卡片元素变换矩阵，若视图模型不存在或获取失败则返回 null
 */

export class ViewModelService {

  /** 存放上次卡片元素变换矩阵数据*/
  static lastCardsMatrix3d: Matrix3d[] | null = null;

  /** 获取卡片元素变换矩阵数据 */
  static getCardsMatrix3d(layoutStyle: LayoutStyle): Matrix3d[] {

    // 卡片元素变换矩阵数据
    const cardsMatrix3d: Matrix3d[] = new ViewModelFactory(layoutStyle).calcCardsMatrix3d();

    // 记录上次卡片元素变换矩阵数据*/
    ViewModelService.lastCardsMatrix3d = cardsMatrix3d;

    // 创建对应视图模型的 ViewModelFactory 实例并获取卡片元素变换矩阵
    return cardsMatrix3d;
  }

  static getCardsWrapMatrix3d(layoutStyle: LayoutStyle): Matrix3d {
    return new ViewModelFactory(layoutStyle).calcCardsWrapMatrix3d();
  }
}