import { VisualModel } from '@/visual/VisualModel';
import { RegVisModel } from '@/utils/RegVisModel';
import { MoStatus, type Matrix3D } from '@/typings';

@RegVisModel(VisualModel)
class CyModel extends VisualModel {
  // 明确声明对应的状态枚举值
  static readonly MODEL_STATUS = MoStatus.cy;
  constructor (...args: any) {
    super(args)
  }
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

export default CyModel;