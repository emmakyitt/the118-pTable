import type { 
  LayoutStyle,
  Matrix3D,
  IViewModelFactory,
  IViewModelCtor } from '@/domain/models/typings';

/**
 * 视图模型抽象基类
 * 
 * 提供统一的获取变换矩阵接口，直接实例化本类时，会自动根据 layoutStyle 状态枚举
 * 动态路由到对应子类, 并返回子类实例。
 */ 
export default class ViewModelFactory implements IViewModelFactory {

  /** 静态注册表：存储所有子类构造函数的映射 (key 为模型标识) */
  static registry: Record<string, IViewModelCtor> = {};

   /**
   * @param layoutStyle - 布局模式状态
   * 当使用 new ViewModelFactory(LayoutStyle) 调用时，会从注册表中寻找对应的子类
   * 并返回子类实例（多态）
   */
  constructor (layoutStyle: LayoutStyle) {

    // 仅在直接实例化基类（而非子类通过 super 调用）时进行路由
    if (new.target === ViewModelFactory) {
      try { return new ViewModelFactory.registry[layoutStyle](layoutStyle) } // 返回子类实例
      catch (e: any) { throw new Error(`Visual model not found：${layoutStyle}`) } 
    }
  }

  /**
   * 获取当前模型的 4x4 矩阵（抽象方法）
   * 子类必须覆盖此方法以提供具体矩阵逻辑
   * @throws 当基类未被子类实现时调用
   */
  public getMatrix3d(): Matrix3D[] {
    throw new Error('子类必须实现 getMatrix3d 方法');
  }
};