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

/**
 * 单位矩阵 
 */
export type Matrix = [number, number, number, number];

/**
 * 4x4 矩阵（以行主序表示）
 * 每个元素为长度为 4 的数组，整体是 4 个长度为 4 的数组组成的元组
 */
export type Matrix3D = [Matrix, Matrix, Matrix, Matrix];

/** 布局模型接口：所有视图模型需实现此接口 */
export interface IViewModelFactory {

  /** 额外属性 */
  [x: string]: any;

  /** 获取当前模型的 4x4 矩阵 */
  getMatrix3d() : Matrix3D[];
}

/** 子类构造函数签名：确保注册表中存放的是可实例化的子类 */
export interface IViewModelCtor {
  new (layoutStyle: LayoutStyle): IViewModelFactory;
}      
