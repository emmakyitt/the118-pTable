import { MoStatus, type Matrix3D } from '@/typings';

// 子类构造函数签名
export interface VisualModelConstructor {
  new (moStatus: MoStatus): VisualModel;
}      

// 布局模型
export interface VisualModel {
  moStatus: MoStatus;
  registry: Record<string, VisualModelConstructor>;
  getMatrix3d() : Matrix3D;
  create(callback: (matrix: Matrix3D) => void): void;
}

// 模型父类
export class VisualModel implements VisualModel {
  // 静态注册表（所有子类共享）
  static registry: Record<string, VisualModelConstructor> = {};

  constructor (public moStatus: MoStatus) {
    // 此构造函数实例化后返回一个子模型类实例对象
    if (new.target === VisualModel) {
      // 根据moStatus状态来返回其对应的视图模型
      const Ctor = VisualModel.registry[moStatus];

      if (!Ctor) {
        throw new Error(`未找到模型：${moStatus}`);
      }
      return new Ctor(moStatus);
    }
  }
  public create(callback: (matrix: Matrix3D) => void): void {
    callback(this.getMatrix3d());
  }

  // 抽象方法，子类必须实现
  public getMatrix3d(): Matrix3D {
    throw new Error('子类必须实现 getMatrix3d 方法');
  }
};