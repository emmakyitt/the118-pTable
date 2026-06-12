import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import MathTools from '@/infrastructure/utils/MathTools';
import { LayoutStyle } from '@/domain/typings/viewModels';

/**
 * 布局模型（SphViewModel）：生成化学元素周期表（球体形态）的点阵布局。
 * 
 * 设计思路：
 * - 纬线方向采用不均匀分布，使元素在球面上疏密有致（极区稀疏、赤道密集）。
 * - 经线方向在每个纬度圈内均匀分布。

 * 通过装饰器 @registerTo 将 SphViewModel 注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.SPH 枚举值一致 
 */
@registerTo(ViewModelFactory)
export default class SphViewModel extends ViewModelFactory {

  /** 明确声明的注册标识，与 LAYOUT_STYLE 枚举保持一致 */
  static readonly LAYOUT_STYLE = LayoutStyle.SPH;

  /** 元素总个数 */
  private static readonly ELEMENT_COUNT: number = 118;

  /** Z 轴偏移量 */
  private static readonly Z_AXIS_OFFSET: Matrix = Object.freeze([0, 0, 250, 0]) as Matrix;

  /** 元素XY轴缩放量 */
  private static readonly XY_AXIS_SCALE: Matrix = Object.freeze([.6, .6, 1, 2]) as Matrix;


  // ==================== 缓存区域 ====================

  /**
   * 变换矩阵缓存。
   * 首次计算后存储，后续调用直接复用，避免重复生成矩阵。
   */
  private static cachedMatrices: Matrix3d[] | null = null;

  /**
   * 球面分布数据缓存。
   * 包含每组元素的绕 X 轴旋转角度及对应纬度圈上的元素个数，
   * 由 getSphereArrays() 计算一次后永久复用。
   */
  private static cachedSphereArrays: {
    elementsAngle: number[];
    elementsDistr: number[];
  } | null = null;


  // ==================== 静态计算方法 ====================

  /**
   * 计算球面分布所需的纬度角度和每个纬度圈上的元素个数。
   *
   * 算法概要：
   * 1. 将北半球纬度划分为 4 个区间（90°, 90°-d, 90°-2d, 90°-3d），
   *    其中 d = 180/7 ≈ 25.714°。
   * 2. 根据纬度余弦值加权分配元素数量，使赤道附近容纳更多元素 (即0度附近)。
   * 3. 南北半球对称，因此最终数组包含 8 组数据（4 北 + 4 南）。
   *
   * @returns {{ elementsAngle: number[]; elementsDistr: number[] }}
   *   - elementsAngle: 每组绕 X 轴的旋转角度（角度制），长度 8。
   *   - elementsDistr: 每个角度组内包含的元素个数，长度 8，总和为 ELEMENT_COUNT。
   */
  private static getSphereArrays(): {
    elementsAngle: number[],
    elementsDistr: number[]
  } {

    // 命中缓存则直接返回
    if (SphViewModel.cachedSphereArrays) {
      return SphViewModel.cachedSphereArrays;
    }

    const d = 180 / 7;
    const t = SphViewModel.ELEMENT_COUNT / 2 - 1;           // 北半球除极点外的元素总数
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

     SphViewModel.cachedSphereArrays = sphereArrays;
    return sphereArrays;
  }

  // ==================== 公共接口 ====================

  /**
   * 计算当前模型下所有卡片元素的变换矩阵（缩放 + 旋转 + 平移 + 缩放）
   *
   * 算法：
   * 1. 从缓存读取或计算球面分布数据。
   * 2. 对每个纬度圈上的每个元素，计算其旋转矩阵（绕 X 轴 + 绕 Y 轴），并结合偏移与缩放，得出最终变换矩阵。
   * 3. 结果按纬度组顺序排列，总长度恒为 118。
   *
   * 
   * 重要：请勿修改返回的数组或其内部的矩阵对象，否则会污染缓存，
   * 影响后续调用。若需修改，请自行进行深拷贝。
   *
   * @returns Matrix3d[] 卡片元素的变换矩阵数组
   * 每个矩阵描述了对应卡片元素的局部变换，其中平移部分决定其位置
   */
  public calcCardsMatrix3d(): Matrix3d[] {

    // 命中缓存则直接返回引用，不再生成额外数组副本
    if (SphViewModel.cachedMatrices) {
      return SphViewModel.cachedMatrices;
    }

    // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const matrices: Matrix3d[] = new Array<Matrix3d>(SphViewModel.ELEMENT_COUNT);

    // 复用临时数组，避免在循环内重复创建新数组对象
    const rotateArray: Matrix = [0, 0, 0, 1];

    // 缓存静态属性到局部变量，减少属性访问开销
    const zAxisOffset: Matrix = SphViewModel.Z_AXIS_OFFSET 
    const xyAxisScale: Matrix = SphViewModel.XY_AXIS_SCALE 
    const scalesMatrix: Matrix = [.5, .5, 1, 2];

    // 矩阵变换参数 [缩放, 平移，旋转，缩放]
    const matrixsArgs: Matrix[] = [scalesMatrix, zAxisOffset, rotateArray, xyAxisScale];

    // 获取球面分布所需的纬度角度和每个纬度圈上的元素个数。
    const { elementsAngle, elementsDistr } = SphViewModel.getSphereArrays();

    let idx: number = 0;
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
        // rotateArray[2] 保持 0
        // rotateArray[3] 保持 1

        // 通过工具函数生成变换矩阵（平移，旋转，缩放）--> 执行顺序 先缩放, 后旋转, 再平移 (注意: 变换从右向左应用)
        matrices[idx] = MatrixTools.transform(matrixsArgs);
      }
    }

    /**
     * 注意：返回数组的内部引用
     * 请勿修改数组内矩阵对象的内容，否则会污染缓存。
     */
    SphViewModel.cachedMatrices = matrices;
    return matrices;
  }
}