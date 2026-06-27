import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import { LayoutStyle } from '@/domain/typings/viewModels';
import { cardsWrapDfltMatix3d } from '@/domain/viewModels';


// ==================== 螺旋布局常量 ====================

const ELEMENT_COUNT: number = 118;      // 元素总个数（化学元素周期表全部已知元素）
const ELEMENT_PER_TURN: number = 20;    // 每圈（完整旋转 360°）包含的元素个数
const ELEMENT_OFFSET_Z: number = 200;   // 螺旋半径（元素在 X-Z 平面上的偏移距离，即距 Y 轴的距离）

const STEP_Y: number = 5;                                                // 相邻元素在 Y 轴方向上的间距（像素）
const HELIX_BOX_SIZE_H: number = ELEMENT_COUNT * STEP_Y;                 // 整个螺旋的总高度（像素）
const SCALE_MATRIX: Matrix = Object.freeze([.5, .5, 1, 2]) as Matrix;    // 每个元素在 X、Y 轴的缩放系数（0.5 倍）
const FIRST_CARD_Y: number = -HELIX_BOX_SIZE_H / 2 - STEP_Y;             // 第一个元素的 Y 轴基准坐标，使螺旋整体在 Y 轴方向居中
const ANGLE_STEP:   number = 360 / ELEMENT_PER_TURN;                     // 相邻元素绕 Y 轴的角度增量（度），每圈均匀分布

/**
 * 布局模型：HelViewModel（Helix 螺旋模型）用于生成化学元素周期表的螺旋形态布局
 * 
 * - 所有元素沿 Y 轴等间距排列（从上到下）
 * - 每个元素同时绕 Y 轴旋转，形成螺旋上升效果
 * - 每圈包含固定数量（ELEMENT_PER_TURN）的元素，角度均匀分布
 * - 每个元素应用了固定的缩放（0.5 倍），形成卡片大小
 *
 * 通过装饰器 @registerTo 将该模型注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.HEL 枚举值一致
 */
@registerTo(ViewModelFactory)
export default class HelViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle.HEL 保持一致，
   * 用于工厂模式识别当前模型
   */
  static readonly LAYOUT_STYLE = LayoutStyle.HEL;


  // ==================== 缓存区域 ====================
  /**
   * 缓存所有卡片的 3D 变换矩阵（Matrix3d[]）
   * 首次计算后存储，后续调用直接复用，避免重复计算
   * 注意：矩阵对象为不可变引用，外部不应修改其内容，否则会污染缓存
   */
  private static cachedMatrices: Matrix3d[];

  /**
   * 缓存每个卡片的变换参数（Matrix[]），即 [缩放, 平移, 旋转] 三元组，
   * 用于后续计算容器整体变换时反推元素原始位置
   */
  private static cardsTransform: Matrix[][];


  // ==================== 公共接口 ====================
  /**
   * 计算当前模型下所有卡片元素的独立 3D 变换矩阵。
   *
   * 算法步骤：
   * 1. 遍历所有元素（0 ~ ELEMENT_COUNT-1），计算其 Y 轴坐标（从顶部到底部均匀分布）
   * 2. 计算每个元素绕 Y 轴的旋转角度（根据索引取模，均匀分布在圆上）
   * 3. 构建变换参数数组 [缩放, 平移, 旋转]（其中平移的 Z 分量固定为螺旋半径）
   * 4. 调用 MatrixTools.transform 生成最终矩阵（执行顺序：旋转 → 平移 → 缩放）
   * 5. 缓存结果，后续调用直接返回缓存引用
   *
   * @returns {Matrix3d[]} 卡片元素的 3D 变换矩阵数组，顺序与元素索引一一对应
   * 
   * @remarks
   * - 由于使用静态缓存，所有实例共享同一计算结果
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    // 命中缓存则直接返回引用，不再生成额外数组副本
    if (HelViewModel.cachedMatrices) {
      return HelViewModel.cachedMatrices;
    }

    const rotateArray: Matrix = [0, 0, 0, 1];                                 // 复用临时数组，避免在循环内重复创建新数组对象，提升性能
    const yAxisOffset: Matrix = [0, 0, ELEMENT_OFFSET_Z, 0];                  // 平移动态数组，Z 分量固定为螺旋半径，X 分量为 0，Y 分量在循环中动态更新
    const matrixsArgs: Matrix[] = [SCALE_MATRIX, yAxisOffset, rotateArray];   // 变换参数：[缩放, 平移, 旋转]（注意执行顺序：先旋转，后平移，再缩放）
    const matrices: Matrix3d[] = new Array<Matrix3d>(ELEMENT_COUNT);          // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const cardsTra: Matrix[][] = new Array<Matrix[]>(ELEMENT_COUNT);          // 预分配数组长度，避免在循环中使用 push 导致多次扩容

    for (let i = 0; i<ELEMENT_COUNT; i++) {

      yAxisOffset[1] = FIRST_CARD_Y + i * STEP_Y;                             // 当前元素的 Y 轴位置 + (索引 * 垂直步长)
      rotateArray[1] = i % ELEMENT_PER_TURN * ANGLE_STEP;                     // 当前元素绕 Y 轴的旋转角度（每圈均匀分布）

      // 生成变换矩阵（注意：MatrixTools.transform 执行顺序为 旋转 → 平移 → 缩放）
      matrices[i] = MatrixTools.transform(matrixsArgs);
      cardsTra[i] = structuredClone(matrixsArgs);  // 深拷贝变换参数，保存当前状态用于后续容器变换计算
    }

    // 缓存计算结果
    HelViewModel.cachedMatrices = matrices;
    HelViewModel.cardsTransform = cardsTra;

    return matrices;
  }

  /**
   * 根据选中的卡片 ID 计算整个卡片容器的 3D 变换矩阵
   *
   * 该矩阵用于使选中的卡片移动到视觉焦点（屏幕中心），同时保持螺旋形态的视觉连贯性
   * 
   * 算法基于目标卡片的变换参数：
   * 1. 若 elementId 为 0（取消选中），返回一个整体缩放矩阵（0.8 倍），使所有卡片略微缩小，表示取消焦点
   * 2. 否则，获取目标卡片的变换参数，反向旋转 Y 轴（抵消自身旋转），并反向平移 Y 轴（抵消 Y 方向偏移），
   *    最后沿 Z 轴正向平移 50 像素，使卡片浮于表面
   *
   * @param elementId - 被选中的卡片 ID（从 1 开始，传入 0 表示取消选中）
   * @returns {Matrix3d} 容器整体的 3D 变换矩阵
   *
   * @remarks
   * - 本方法依赖缓存 `HelViewModel.cardsTransform`，请确保在调用 `calcCardsMatrix3d` 之后使用
   * - 取消选中时返回缩放矩阵而非单位矩阵，是设计上的视觉效果（整体缩小表示非聚焦状态）
   * - 计算过程：先旋转使卡片正对 Z 轴，再平移使卡片中心移至原点，最后沿 Z 轴前移 50 像素
   */
  public calcCardsWrapMatrix3d (elementId: number): Matrix3d {

    // 取消选中时，容器恢复初始状态
    if(!elementId) return cardsWrapDfltMatix3d[HelViewModel.LAYOUT_STYLE];

    // 获取目标卡片的变换参数 [缩放, 平移, 旋转]
    const cardTransform: Matrix[] = HelViewModel.cardsTransform[elementId-1];

    /**
     * 卡片容器变换矩阵:
     * 1. 绕 Y 轴反向旋转，抵消卡片自身旋转 → 使其正对视角
     * 2. 沿 Y 轴反向平移，抵消卡片 Y 方向偏移 → 使其在 Y 方向归零
     * 3. 沿 Z 轴正向平移 50 像素，使卡片浮在视野前方
     */
    return MatrixTools.multiplyMatrices([
      MatrixTools.rotateY(-cardTransform[2][1]),
      MatrixTools.offsetY(-cardTransform[1][1]),
      MatrixTools.offsetZ(50)
    ])
  }
}