import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import MathTools from '@/infrastructure/utils/MathTools';
import { LayoutStyle } from '@/domain/typings/viewModels';


const ELEMENT_COUNT: number = 118;                                      // 元素总个数（化学元素周期表全部已知元素）
const Z_AXIS_OFFSET: Matrix = Object.freeze([0, 0, 250, 0]) as Matrix;  // Z 轴偏移量
const SCALE_MATRIX:  Matrix = Object.freeze([.5, .5, 1, 2]) as Matrix;  // 元素卡片缩放量


/**
   * 计算球面分布所需的纬度角度和每个纬度圈上的元素个数
   *
   * 算法概要：
   * 1. 将北半球纬度划分为 4 个区间（90°, 90°-d, 90°-2d, 90°-3d），
   *    其中 d = 180/7 ≈ 25.714°
   * 2. 根据纬度余弦值加权分配元素数量，使赤道附近容纳更多元素 (即0度附近)
   * 3. 南北半球对称，因此最终数组包含 8 组数据（4 北 + 4 南
   *
   * @returns {{ elementsAngle: number[]; elementsDistr: number[] }}
   *   - elementsAngle: 每组绕 X 轴的旋转角度（角度制），长度 8
   *   - elementsDistr: 每个角度组内包含的元素个数，长度 8，总和为 ELEMENT_COUNT
   */
function getSphereArrays (): {
  elementsAngle: number[],
  elementsDistr: number[]
} {

  const d = 180 / 7;
  const t = ELEMENT_COUNT / 2 - 1;                   // 北半球除极点外的元素总数
  const latN = [90, 90 - d, 90 - 2 * d, 90 - 3 * d]; // 北半球四个纬度（从北极点到赤道附近）

  // 除极点外各纬度的余弦值
  const cosines: number[] = latN.slice(1).map(d => MathTools.cosineByAngle(d)); 

  // 余弦值加权分配元素个数
  const rFactor: number = t / cosines.reduce((a, b) => a + b, 0);
  const counter: number[] = [1, ...cosines.map(i => Math.round(rFactor * i))];

  // 南北对称拼接
  const sphereArrays = {
    elementsAngle: [...latN, ...latN.reverse().map(i => -i)],  // 每组绕 X 轴的旋转角度（角度制）
    elementsDistr: [...counter, ...counter.reverse()],
  };

  return sphereArrays;
}


/**
 * 布局模型（SphViewModel）：生成化学元素周期表（球体形态）的点阵布局
 * 
 * 设计思路：
 * - 纬线方向采用不均匀分布，使元素在球面上疏密有致（极区稀疏、赤道密集
 * - 经线方向在每个纬度圈内均匀分布

 * 通过装饰器 @registerTo 将 SphViewModel 注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.SPH 枚举值一致 
 */
@registerTo(ViewModelFactory)
export default class SphViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle 枚举保持一致
   */
  static readonly LAYOUT_STYLE = LayoutStyle.SPH;


  // ==================== 缓存区域 ====================
  /**
   * 变换矩阵缓存。
   * 首次计算后存储，后续调用直接复用，避免重复生成矩阵。
   */
  private static cachedMatrices: Matrix3d[];
  

  // ==================== 公共接口 ====================
  /**
   * 计算当前模型下所有卡片元素的变换矩阵（缩放 + 旋转 + 平移 + 缩放）
   *
   * 算法：
   * 1. 从缓存读取或计算球面分布数据
   * 2. 对每个纬度圈上的每个元素，计算其旋转矩阵（绕 X 轴 + 绕 Y 轴），并结合偏移与缩放，得出最终变换矩阵
   * 3. 结果按纬度组顺序排列，总长度恒为 118
   *
   * 
   * @returns Matrix3d[] 卡片元素的变换矩阵数组
   * 每个矩阵描述了对应卡片元素的局部变换，其中平移部分决定其位置
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    // 命中缓存则直接返回引用，不再生成额外数组副本
    if (SphViewModel.cachedMatrices) {
      return SphViewModel.cachedMatrices;
    }

    const rotateArray: Matrix   = [0, 0, 0, 1];                                 // 复用临时数组，避免在循环内重复创建新数组对象
    const matrixsArgs: Matrix[] = [SCALE_MATRIX, Z_AXIS_OFFSET, rotateArray];   // 矩阵变换参数 [缩放, 平移，旋转]
    const matrices:  Matrix3d[] = new Array<Matrix3d>(ELEMENT_COUNT);           // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const { elementsAngle, elementsDistr } = getSphereArrays();                 // 获取球面分布所需的纬度和每个纬度圈上的元素个数
    let idx: number = 0;                                                        // 记录数组下标

    for (let i=0; i<elementsDistr.length; i++) {

      // 当前循环元素排布数量
      const count = elementsDistr[i];

       // 提前计算每个纬度组的角度与步长，消除循环内重复运算
      const rotateX = -elementsAngle[i];
      const rotateY = 360 / count;

      for (let j=0; j<count; j++, idx++) {

        // 更新复用数组的元素值（绕 X 轴角度 + 绕 Y 轴角度）
        rotateArray[0] = rotateX;
        rotateArray[1] = rotateY * j - 180;

        // 通过工具函数生成变换矩阵 [缩放，平移，旋转]--> 执行顺序 先旋转, 后平移, 再缩放 (注意: 变换从右向左应用)
        matrices[idx] = MatrixTools.transform(matrixsArgs);
      }
    }

    /**
     * 注意：返回数组的内部引用
     * 请勿修改数组内矩阵对象的内容，否则会污染缓存
     */
    SphViewModel.cachedMatrices = matrices;
    return matrices;
  }

  public calcCardsWrapMatrix3d (): Matrix3d {
    return MatrixTools.scale([.6, .6, 1, 2])
  }
}