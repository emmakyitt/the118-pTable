import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import { LayoutStyle } from '@/domain/typings/viewModels';


// ==================== 网格布局常量 ====================

const ROW_MAX: number = 5;                                                 // 每层面板的最大行数
const COL_MAX: number = 8;                                                 // 每层面板的最大列数
const ELEMENT_SIZE:  number = 50;                                          // 单个元素的基准尺寸（宽/高，单位：像素）
const ELEMENT_COUNT: number = 118;                                         // 元素总个数（化学元素周期表全部已知元素）
const ROTATE_MATRIX: Matrix = Object.freeze([0, -25, 0, 1]) as Matrix;     // 每个元素绕 Y 轴的旋转量（-25 度），用于产生立体透视效果
const SCALE_MATRIX:  Matrix = Object.freeze([.5, .5, 1, 2]) as Matrix;     // 每个元素在 X、Y 轴的缩放系数（0.5 倍）
const PANEL_SIZE: number = ROW_MAX * COL_MAX;                              // 单个面板可容纳的元素数量（行数 × 列数）
const GUTTER: number = 50;                                                 // 相邻元素之间的间隔（单位：像素）

/**
 * 整个网格的总尺寸（宽 × 高
 */
const GRID_SIZE_W: number = (ELEMENT_SIZE + GUTTER) * COL_MAX;
const GRID_SIZE_H: number = (ELEMENT_SIZE + GUTTER) * ROW_MAX;

/**
 * 第一个元素（网格左上角起始元素）的基准坐标。
 * 以网格中心为原点，整体居中偏移，使网格居中显示。
 */
const FIRST_CARD_X: number = -GRID_SIZE_W / 2;
const FIRST_CARD_Y: number = -GRID_SIZE_H / 2;


/**
 * 布局模型：GriViewModel（Grid 网格模型）
 *
 * 算法概要：
 * - 将 118 个元素按顺序分配到多个“面板”（Panel），每个面板为 ROW_MAX × COL_MAX 的网格
 * - 面板内按行优先顺序排列（从左到右下）
 * - 不同面板沿 Z 轴方向平移，形成层叠（类似卡片堆叠）效果
 * - 每个元素额外应用一次绕 Y 轴的旋转（-25°），增强立体感
 *
 * 通过装饰器 @registerTo 将该模型注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.GRI 枚举值一致，以便工厂根据样式创建对应实例
 */
@registerTo(ViewModelFactory)
export default class GriViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle.GRI 保持一致，
   * 用于工厂模式中识别当前模型
   */
  static readonly LAYOUT_STYLE = LayoutStyle.GRI;

  
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
   * 计算当前模型下所有卡片元素的独立 3D 变换矩阵
   *
   * 算法步骤：
   * 1. 遍历所有元素（0 ~ ELEMENT_COUNT-1），确定其所在面板索引及面板内序号
   * 2. 根据面板内行列索引计算元素的 X、Y 坐标
   * 3. 根据面板索引计算 Z 坐标（沿 Z 轴堆叠）
   * 4. 构建变换参数数组 [缩放, 平移, 旋转]，调用 MatrixTools.transform 生成最终矩阵
   * 5. 缓存结果（矩阵数组及参数数组），后续调用直接返回缓存
   *
   * @returns {Matrix3d[]} 卡片元素的 3D 变换矩阵数组，顺序与元素索引一一对应
   * 
   * @remarks
   * - 由于使用静态缓存，所有实例共享同一计算结果
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    // 命中缓存则直接返回，避免重复计算
    if (GriViewModel.cachedMatrices) {
      return GriViewModel.cachedMatrices;
    }

    const offsetMatrix:  Matrix = [0, 0, 0, 0];                                   // 复用临时数组，避免在循环内重复创建新数组对象，提高性能
    const matrixsArgs: Matrix[] = [SCALE_MATRIX, offsetMatrix, ROTATE_MATRIX];    // 矩阵变换参数：[缩放, 平移, 旋转]（执行顺序：先旋转，后平移，再缩放）
    const stepLength:   number = ELEMENT_SIZE + GUTTER;                           // 每步移动距离（包含元素尺寸与间隔）
    const matrices: Matrix3d[] = new Array<Matrix3d>(ELEMENT_COUNT);              // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const cardsTra: Matrix[][] = new Array<Matrix[]>(ELEMENT_COUNT);              // 预分配数组长度，避免在循环中使用 push 导致多次扩容

    for (let i=0; i<ELEMENT_COUNT; i++) {

      // 计算当前元素所在的面板索引，以及在该面板内的序号
      const panelIndex: number = Math.floor(i / PANEL_SIZE);
      const idxInPanel: number = i % PANEL_SIZE;  

      // 当前元素在面板中的列、行索引
      const col = idxInPanel % COL_MAX;
      const row = idxInPanel % ROW_MAX;

      // 计算元素在页面上的坐标（以网格中心为原点）
      offsetMatrix[0] = FIRST_CARD_X + col * stepLength + ELEMENT_SIZE;
      offsetMatrix[1] = FIRST_CARD_Y + row * stepLength + ELEMENT_SIZE;
      offsetMatrix[2] = panelIndex * GUTTER * 2; // Z 轴偏移，使面板层叠

      // 生成变换矩阵（注意：MatrixTools.transform 执行顺序为 旋转 → 平移 → 缩放）
      matrices[i] = MatrixTools.transform(matrixsArgs);
      cardsTra[i] = structuredClone(matrixsArgs);  // 深拷贝变换参数，保存当前状态用于后续容器变换计算
    }

    // 缓存计算结果
    GriViewModel.cachedMatrices = matrices;
    GriViewModel.cardsTransform = cardsTra;

    return matrices;
  }


   /**
   * 根据选中的卡片 ID 计算整个卡片容器的 3D 变换矩阵
   *
   * 该矩阵用于使选中的卡片移动到视觉焦点（屏幕中心）
   * 算法基于目标卡片当前的变换参数（缩放、平移、旋转），反向计算容器偏移，
   * 使得该卡片居中并正对视角
   *
   * @param elementId - 被选中的卡片 ID（从 1 开始，传入 0 表示取消选中）
   * @returns {Matrix3d} 容器整体的 3D 变换矩阵
   *
   * @remarks
   * - 若 elementId 为 0，则返回单位矩阵（无变换）
   * - 此方法依赖缓存 `GriViewModel.cardsTransform`，确保在调用 `calcCardsMatrix3d` 之后使用
   * - 计算过程：先旋转使卡片正对 Z 轴，再平移使卡片中心移至原点，最后沿 Z 轴前移 250 像素
   */
  public calcCardsWrapMatrix3d (elementId: number): Matrix3d {

    // 取消选中时，返回单位矩阵，容器恢复初始状态
    if(!elementId) return MatrixTools.identityMatrix();

    // 获取目标卡片的变换参数 [缩放, 平移, 旋转]（索引从 0 开始，而 elementId 从 1 开始, 因此执行 elementId-1）
    const cardTransform: Matrix[] = GriViewModel.cardsTransform[elementId-1];

    /**
     * 卡片容器变换矩阵:
     * 1. 绕 Y 轴反向旋转（抵消卡片自身旋转，使其正对视角）
     * 2. 平移到原点（将卡片中心移动到视觉原点）
     * 3. 沿 Z 轴正向平移 250 像素，使卡片浮在视野前方
     */
    return MatrixTools.multiplyMatrices([
      MatrixTools.rotateY(-cardTransform[2][1]), // 反向旋转 Y 轴（cardTransform[2] 为旋转矩阵，[1] 为角度）
      MatrixTools.offsetX(-cardTransform[1][0]), 
      MatrixTools.offsetY(-cardTransform[1][1]), 
      MatrixTools.offsetZ(-cardTransform[1][2]), 
      MatrixTools.offsetZ(250)
    ])
  }
}