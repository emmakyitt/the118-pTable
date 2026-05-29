import type { 
  MoStatus,
  Matrix3D,
  IVisualModel, 
  IVisualModelCtor } from '@/typings';

/**
 * 视觉模型抽象基类
 * 
 * 提供统一的创建接口和静态注册表，支持通过状态枚举动态路由到对应子类。
 * 直接实例化本类时，会自动根据 moStatus 选择已注册的子类构造函数并返回其实例。
 */
export class VisualModel implements IVisualModel {

  /** 静态注册表：存储所有子类构造函数的映射 (key 为模型标识) */
  static registry: Record<string, IVisualModelCtor> = {};

   /**
   * @param moStatus - 布局模式状态
   * 当使用 new VisualModel(status) 调用时，会从注册表中寻找对应的子类
   * 并返回子类实例（多态）
   */
  constructor (public moStatus: MoStatus) {

    // 仅在直接实例化基类（而非子类通过 super 调用）时进行路由
    if (new.target === VisualModel) {
      const Ctor = VisualModel.registry[moStatus];
      if (!Ctor) {
        throw new Error(`未找到模型：${moStatus}`);
      }

      // 返回子类实例
      return new Ctor(moStatus);
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