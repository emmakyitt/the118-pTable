import VisualModelFactory from '@/visual/VisualModelFactory';
import registerToVisualModelFactory from '@/visual/register';
import { MoStatus } from '@/typings';
import type { Matrix, Matrix3D } from '@/typings';
import MatrixTools from '@/utils/MatrixTools';

/**
 * 布局模型（HeModel）：生成化学元素周期表（螺旋形态）的点阵布局。
 * 
 * 该模型生成螺旋布局，使所有元素沿 Y 轴螺旋上升排列：
 * - 在 Y 轴方向等间距分布
 * - 同时绕 Y 轴旋转，每圈包含固定数量的元素
 * 
 * 通过装饰器 @registerToVisualModelFactory 自动注册到 VisualModelFactory.registry，
 * 注册标识与 MoStatus.He 枚举值一致
 */
@registerToVisualModelFactory()
export default class HeModel extends VisualModelFactory {

  /** 明确声明的注册标识，与 MoStatus 枚举保持一致 */
  static readonly MODEL_STATUS = MoStatus.He;

  /** 元素总个数 */
  private static readonly ELEMENT_COUNT: number = 118;

  /** 每圈元素个数 */
  private static readonly ELEMENT_PER_TURN: number = 20;

  /** 螺旋半径（元素到 Y 轴的距离）*/
  private static readonly ELEMENT_OFFSET_Z: number = 200;

  /** 相邻元素在 Y 轴方向上的间距 */
  private static readonly EL_STRIDE_LENGTH: number = 5;

  /** 相邻元素绕 Y 轴的角度增量（度） */
  private static readonly ANGLE_STEP = 360 / HeModel.ELEMENT_PER_TURN;

  /** 整个螺旋的总高度 */
  private static readonly HELIX_SIZE_H: number = HeModel.ELEMENT_COUNT * HeModel.EL_STRIDE_LENGTH;

  /**
   * 第一个元素 Y 轴基准坐标。
   * 以螺旋中心为原点，使整体在 Y 轴方向上居中。
   */
  private static readonly FIRST_ELEMENT_POSITION_Y: number = -HeModel.HELIX_SIZE_H / 2 - HeModel.EL_STRIDE_LENGTH;

  /** 元素XY轴缩放量 */
  private static readonly XY_AXIS_SCALE: Matrix = Object.freeze([.8, .8, 1, 2]) as Matrix;


  // ==================== 缓存区域 ====================

  /**
   * 变换矩阵缓存。
   * 首次计算后存储，后续调用直接复用，避免重复生成矩阵。
   */
  private static cachedMatrices: Matrix3D[] | null = null;


  // ==================== 公共接口 ====================
  
   /**
   * 获取当前模型下所有元素的 3D 变换矩阵（螺旋布局）
   *
   * 为了提高性能，该方法返回内部缓存数组的引用。
   * 
   * 重要：请勿修改返回的数组或其内部的矩阵对象，否则会污染缓存，
   * 影响后续调用。若需修改，请自行进行深拷贝。
   *
   * @returns 变换矩阵数组，每个矩阵对应一个可视元素
   */
  getMatrix3d(): Matrix3D[] {

    // 命中缓存则直接返回引用，不再生成额外数组副本
    if (HeModel.cachedMatrices) {
      return HeModel.cachedMatrices;
    }

    // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const matrices: Matrix3D[] = new Array<Matrix3D>(HeModel.ELEMENT_COUNT);

    // 每步跨度（单位 / 像素）
    const stepY: number = HeModel.EL_STRIDE_LENGTH;

    // 螺旋中心到 Y 轴的距离
    const offsetZ: number = HeModel.ELEMENT_OFFSET_Z;

    // 每圈元素个数
    const perTurn: number = HeModel.ELEMENT_PER_TURN;

    // 相邻元素绕 Y 轴的角度增量
    const angleStep: number = HeModel.ANGLE_STEP;

    // 第一个元素位置
    const firstElementY: number = HeModel.FIRST_ELEMENT_POSITION_Y;

    /** 元素总个数 */
    const elementCount: number = HeModel.ELEMENT_COUNT;

    // 复用临时数组，避免在循环内重复创建新数组对象
    const rotateArray: Matrix = [0, 0, 0, 1];

    // 缓存静态属性到局部变量，减少属性访问开销
    const yAxisOffset: Matrix = [0, 0, offsetZ, 0];
    const xyAxisScale: Matrix = HeModel.XY_AXIS_SCALE;

    // 矩阵变换参数 [平移，旋转，缩放]
    const matrixsArgs: Matrix[] = [yAxisOffset, rotateArray, xyAxisScale];

    for (let i = 0; i<elementCount; i++) {

      yAxisOffset[1] = firstElementY + i * stepY; // 当前元素的 Y 轴位置 + (索引 * 垂直步长)
      rotateArray[1] = i % perTurn * angleStep;   // 当前元素绕 Y 轴的旋转角度（每圈 perTurn 个元素均匀分布）

      // 通过工具函数生成变换矩阵（先平移，再旋转）
      matrices[i] = MatrixTools.transform(matrixsArgs);
    }

    /**
     * 注意：返回数组的内部引用
     * 请勿修改数组内矩阵对象的内容，否则会污染缓存。
     */
    HeModel.cachedMatrices = matrices;
    return matrices;
  }
}