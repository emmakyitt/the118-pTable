import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import { LayoutStyle } from '@/domain/typings/viewModels';

const ELEMENT_COUNT: number = 118;      // 元素总个数（化学元素周期表全部已知元素）
const ELEMENT_PER_TURN: number = 20;    // 每圈元素个数
const ELEMENT_OFFSET_Z: number = 200;   // 螺旋半径（元素 Z轴距离)

const STEP_Y: number = 5;                                                // Y轴的间距
const HELIX_BOX_SIZE_H: number = ELEMENT_COUNT * STEP_Y;                 // 整个螺旋的总高度
const SCALE_MATRIX: Matrix = Object.freeze([.5, .5, 1, 2]) as Matrix;    // 元素XY轴缩放量
const FIRST_CARD_Y: number = -HELIX_BOX_SIZE_H / 2 - STEP_Y;             // 第一个元素 Y 轴基准坐标。以螺旋中心为原点，使整体在 Y 轴方向上居中
const ANGLE_STEP:   number = 360 / ELEMENT_PER_TURN;                     // 相邻元素绕 Y 轴的角度增量（度)

/**
 * 布局模型（HelViewModel）：生成化学元素周期表（螺旋形态）的点阵布局
 * 
 * 该模型生成螺旋布局，使所有元素沿 Y 轴螺旋上升排列：
 * - 在 Y 轴方向等间距分布
 * - 同时绕 Y 轴旋转，每圈包含固定数量的元素
 * 
 * 通过装饰器 @registerTo 将 HelViewModel 注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.HEL 枚举值一致
 */
@registerTo(ViewModelFactory)
export default class HelViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle 枚举保持一致
   */
  static readonly LAYOUT_STYLE = LayoutStyle.HEL;

  // ==================== 缓存区域 ====================
  /**
   * 变换矩阵缓存。
   * 首次计算后存储，后续调用直接复用，避免重复生成矩阵
   */
  private static cachedMatrices: Matrix3d[];


  // ==================== 公共接口 ====================

   /**
   * 计算当前模型下所有卡片元素的变换矩阵（旋转 + 平移 + 缩放）
   *
   * @returns Matrix3d[] 卡片元素的变换矩阵数组
   * 每个矩阵描述了对应卡片元素的局部变换，其中平移部分决定其位置
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    // 命中缓存则直接返回引用，不再生成额外数组副本
    if (HelViewModel.cachedMatrices) {
      return HelViewModel.cachedMatrices;
    }

    const rotateArray: Matrix = [0, 0, 0, 1];                                 // 复用临时数组，避免在循环内重复创建新数组对象
    const yAxisOffset: Matrix = [0, 0, ELEMENT_OFFSET_Z, 0];                  // 缓存静态属性到局部变量，减少属性访问开销
    const matrixsArgs: Matrix[] = [SCALE_MATRIX, yAxisOffset, rotateArray];   // 矩阵变换参数 [缩放，平移，旋转]
    const matrices: Matrix3d[] = new Array<Matrix3d>(ELEMENT_COUNT);          // 预分配数组长度，避免在循环中使用 push 导致多次扩容

    for (let i = 0; i<ELEMENT_COUNT; i++) {

      yAxisOffset[1] = FIRST_CARD_Y + i * STEP_Y;                             // 当前元素的 Y 轴位置 + (索引 * 垂直步长)
      rotateArray[1] = i % ELEMENT_PER_TURN * ANGLE_STEP;                     // 当前元素绕 Y 轴的旋转角度（每圈 ELEMENT_PER_TURN 个元素均匀分布）

      // 通过工具函数生成变换矩阵[缩放，平移，旋转] --> 执行顺序 先旋转, 后平移, 再缩放 (注意: 变换从右向左应用)
      matrices[i] = MatrixTools.transform(matrixsArgs);
    }

    /**
     * 注意：返回数组的内部引用
     * 请勿修改数组内矩阵对象的内容，否则会污染缓存
     */
    HelViewModel.cachedMatrices = matrices;
    return matrices;
  }

  public calcCardsWrapMatrix3d (): Matrix3d {
    return MatrixTools.scale([.8, .8, 1, 2]);
  }
}