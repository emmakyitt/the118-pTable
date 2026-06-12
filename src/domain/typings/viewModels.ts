import type { Matrix3d } from "@/infrastructure/typings/matrixTools";

/** 布局模式：对应不同视图模型的标识 */
export enum  LayoutStyle {
  /** 表格模型 */
  TAB = 'TabViewModel',
  /** 球体模型 */
  SPH = 'SphViewModel',
  /** 螺旋模型 */
  HEL = 'HelViewModel',
  /** 网格模型 */
  GRI = 'GriViewModel',
  /** 随机模型 */
  RAN = 'RanViewModel',
}

/** 布局模型接口：所有视图模型需实现此接口 */
export interface IViewModelFactory {

  /** 计算当前模型下的p所有卡片元素 4x4 变换矩阵 */
  calcCardsMatrix3d() : Matrix3d[];
}

/** 子类构造函数签名：确保注册表中存放的是可实例化的子类 */
export interface IViewModelCtor {
  new (layoutStyle: LayoutStyle): IViewModelFactory;
}