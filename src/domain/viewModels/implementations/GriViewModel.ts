import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import { LayoutStyle } from '@/domain/typings/viewModels';


const ROW_MAX: number = 5;                                                 // 每层面板的最大行数
const COL_MAX: number = 8;                                                 // 每层面板的最大列数
const ELEMENT_SIZE:  number = 50;                                          // 单个元素的基准尺寸（宽/高，单位：像素）
const ELEMENT_COUNT: number = 118;                                         // 元素总个数（化学元素周期表全部已知元素）
const ROTATE_MATRIX: Matrix = Object.freeze([0, -25, 0, 1]) as Matrix;     // 元素 Y轴旋转量
const SCALE_MATRIX:  Matrix = Object.freeze([.5, .5, 1, 2]) as Matrix;     // 元素XY轴缩放量
const PANEL_SIZE: number = ROW_MAX * COL_MAX;                              // 单个面板能容纳的元素数量
const GUTTER: number = 50;                                                 // 相邻元素之间的间隔（单位：像素）

/**
 * 整个网格的总尺寸（宽 × 高
 */
const GRID_SIZE_W: number = (ELEMENT_SIZE + GUTTER) * COL_MAX;
const GRID_SIZE_H: number = (ELEMENT_SIZE + GUTTER) * ROW_MAX;

/**
 * 第一个元素（网格左上角起始元素）的基准坐标
 * 以网格中心为原点，整体居中偏移
 */
const FIRST_CARD_X: number = -GRID_SIZE_W / 2;
const FIRST_CARD_Y: number = -GRID_SIZE_H / 2;


/**
 * 布局模型（GriViewModel）：生成化学元素周期表（网格形态）的点阵布局
 *
 * 模型会将 118 个元素排列在多个“面板”（Panel）中，每个面板是一个
 * ROW_MAX × COL_MAX 的网格。所有面板沿 Z 轴方向堆叠 
 * 
 * 通过装饰器 @registerTo 将 GriViewModel 注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.GRI 枚举值一致
 */
@registerTo(ViewModelFactory)
export default class GriViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle 枚举保持一致
   */
  static readonly LAYOUT_STYLE = LayoutStyle.GRI;

  
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
   * 算法：
   * 1. 将 118 个元素按顺序分配到多个面板，每个面板为 ROW_MAX × COL_MAX 网格
   * 2. 面板内元素按从左到右、从上到下的顺序排列（行优先）
   * 3. 不同面板沿 Z 轴方向平移，形成层叠效果。
   * 4. 每个元素额外应用一次旋转（rotateY=-25°），使卡片产生透视立体感
   *
   * @returns Matrix3d[] 卡片元素的变换矩阵数组
   * 每个矩阵描述了对应卡片元素的局部变换，其中平移部分决定其位置
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    // 命中缓存则直接返回，避免重复计算
    if (GriViewModel.cachedMatrices) {
      return GriViewModel.cachedMatrices;
    }

    const offsetMatrix:  Matrix = [0, 0, 0, 0];                                   // 复用临时数组，避免在循环内重复创建新数组对象
    const matrixsArgs: Matrix[] = [SCALE_MATRIX, offsetMatrix, ROTATE_MATRIX];    // 矩阵变换参数 [缩放，平移，旋转]
    const stepLength:   number = ELEMENT_SIZE + GUTTER;                           // 每步移动距离
    const matrices: Matrix3d[] = new Array<Matrix3d>(ELEMENT_COUNT);              // 预分配数组长度，避免在循环中使用 push 导致多次扩容

    for (let i=0; i<ELEMENT_COUNT; i++) {

      // 计算当前元素所在的面板索引，以及在该面板内的序号
      const panelIndex: number = Math.floor(i / PANEL_SIZE);
      const idxInPanel: number = i % PANEL_SIZE;  

      // 当前元素在面板中的列、行索引
      const col = idxInPanel % COL_MAX;
      const row = idxInPanel % ROW_MAX;

      // 计算元素在页面上的坐标点
      offsetMatrix[0] = FIRST_CARD_X + col * stepLength + ELEMENT_SIZE;
      offsetMatrix[1] = FIRST_CARD_Y + row * stepLength + ELEMENT_SIZE;
      offsetMatrix[2] = panelIndex * GUTTER * 2;

      // 通过工具函数生成变换矩阵 [缩放，平移，旋转]--> 执行顺序 先旋转, 后平移, 再缩放 (注意: 变换从右向左应用)
      matrices[i] = MatrixTools.transform(matrixsArgs);
    }

    /**
     * 注意：返回数组的内部引用
     * 请勿修改数组内矩阵对象的内容，否则会污染缓存
     */
    GriViewModel.cachedMatrices = matrices;
    return matrices;
  }


  public calcCardsWrapMatrix3d (): Matrix3d {
    return MatrixTools.identityMatrix();
  }
}