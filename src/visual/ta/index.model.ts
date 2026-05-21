import { VisualModel } from '@/visual/VisualModel';
import { RegVisModel } from '@/utils/RegVisModel';
import { MoStatus, type Matrix3D } from '@/typings';

/**
 * Ta 模型：对应 Ta 布局模式
 * 通过装饰器自动注册到 VisualModel.registry
 */
@RegVisModel()
class TaModel extends VisualModel {

  /** 明确声明的注册标识，与 MoStatus 枚举保持一致 */
  static readonly MODEL_STATUS = MoStatus.Ta;

  /**
   * 获取当前模型的矩阵
   */
  getMatrix3d(): Matrix3D {
    // 返回实际的矩阵逻辑
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }
}

export default TaModel;