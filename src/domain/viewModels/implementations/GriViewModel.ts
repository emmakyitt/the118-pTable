import type { Matrix, Matrix3D } from '@/domain/models/typings';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import { LayoutStyle } from '@/domain/models/typings';
import MatrixTools from '@/infrastructure/utils/MatrixTools';

/**
 * 布局模型（GriViewModel）：生成化学元素周期表（网格形态）的点阵布局。
 *
 * 模型会将 118 个元素排列在多个“面板”（Panel）中，每个面板是一个
 * ROW_MAX × COL_MAX 的网格。所有面板沿 Z 轴方向堆叠 
 * 
 * 通过装饰器 @registerTo 将 GriViewModel 注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.GRI 枚举值一致
 */
@registerTo(ViewModelFactory)
export default class GriViewModel extends ViewModelFactory {

  /** 明确声明的注册标识，与 LayoutStyle 枚举保持一致 */
  static readonly LAYOUT_STYLE = LayoutStyle.GRI;

  /** 元素总个数（化学元素周期表全部已知元素） */
  private static readonly ELEMENT_COUNT: number = 118;

  /** 单个元素的基准尺寸（宽/高，单位：像素） */
  private static readonly ELEMENT_SIZE: number = 50;

  /** 每层面板的最大行数 */
  private static readonly ROW_MAX:  number = 5;

  /** 每层面板的最大列数 */
  private static readonly COL_MAX:  number = 8;

  /** 相邻元素之间的间隔（单位：像素） */
  private static readonly GUTTER: number = 50;

  /** 单个面板能容纳的元素数量 */
  private static readonly PANEL_SIZE: number = GriViewModel.ROW_MAX * GriViewModel.COL_MAX;

  /** 元素XY轴缩放量 */
  private static readonly ROTATE_MATRIX: Matrix = Object.freeze([0, -25, 0, 1]) as Matrix;

  /** 整个网格的总尺寸（宽 × 高） */
  private static readonly GRID_SIZE: { w: number; h: number } = {
    w: (GriViewModel.ELEMENT_SIZE + GriViewModel.GUTTER) * GriViewModel.COL_MAX,
    h: (GriViewModel.ELEMENT_SIZE + GriViewModel.GUTTER) * GriViewModel.ROW_MAX,
  };

  /**
   * 第一个元素（网格左上角起始元素）的基准坐标。
   * 以网格中心为原点，整体居中偏移。
   */
  private static readonly FIRST_ELEMENT_POSITION: { x: number; y: number } = {
    x: -GriViewModel.GRID_SIZE.w / 2,
    y: -GriViewModel.GRID_SIZE.h / 2,
  };

  // ==================== 缓存区域 ====================

  /**
   * 变换矩阵缓存。
   * 首次计算后存储，后续调用直接复用，避免重复生成矩阵。
   */
  private static cachedMatrices: Matrix3D[] | null = null;


  // ==================== 公共接口 ====================

   /**
   * 获取当前模型下所有元素的 3D 变换矩阵（网格布局）
   *
   * 算法：
   * 1. 将 118 个元素按顺序分配到多个面板，每个面板为 ROW_MAX × COL_MAX 网格。
   * 2. 面板内元素按从左到右、从上到下的顺序排列（行优先）。
   * 3. 不同面板沿 Z 轴方向平移，形成层叠效果。
   * 4. 每个元素额外应用一次旋转（rotateY=-25°），使卡片产生透视立体感。
   *
   * @returns 变换矩阵数组，每个矩阵对应一个可视元素
   */
  public getMatrix3d(): Matrix3D[] {

    // 命中缓存则直接返回，避免重复计算
    if (GriViewModel.cachedMatrices) {
      return GriViewModel.cachedMatrices;
    }

    // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const matrices: Matrix3D[] = new Array<Matrix3D>(GriViewModel.ELEMENT_COUNT);

    // 元素间的间隔
    const gutter: number = GriViewModel.GUTTER;

    // 最大行 / 列
    const rowMax: number = GriViewModel.ROW_MAX;
    const colMax: number = GriViewModel.COL_MAX;

    // 元素基准尺寸
    const elSize: number = GriViewModel.ELEMENT_SIZE;

    // 每步移动距离
    const stepLength: number = elSize + gutter;

    // 第一元素位置
    const firstPositionX: number = GriViewModel.FIRST_ELEMENT_POSITION.x;
    const firstPositionY: number = GriViewModel.FIRST_ELEMENT_POSITION.y;

    // 复用临时数组，避免在循环内重复创建新数组对象
    const offsetMatrix: Matrix = [0, 0, 0, 0];           // [x轴平移, y轴平移, z轴平移, 平移标识]
    const scalesMatrix: Matrix = [.5, .5, 1, 2];
    const rotateMatrix: Matrix = GriViewModel.ROTATE_MATRIX;  // [x轴旋转, y轴旋转, z轴旋转, 旋转标识]

    // 矩阵变换参数 [缩放，平移，旋转]
    const matrixsArgs: Matrix[] = [scalesMatrix, offsetMatrix, rotateMatrix];

    // 元素总个数
    const elementCount: number = GriViewModel.ELEMENT_COUNT;

    // 每层面板容纳的元素数量
    const panelSize: number = GriViewModel.PANEL_SIZE;

    for (let i=0; i<elementCount; i++) {

      // 计算当前元素所在的面板索引，以及在该面板内的序号
      const panelIndex: number = Math.floor(i / panelSize);
      const idxInPanel: number = i % panelSize;  

      // 当前元素在面板中的列、行索引
      const col = idxInPanel % colMax;
      const row = idxInPanel % rowMax;

      // 计算元素在页面上的坐标点
      offsetMatrix[0] = firstPositionX + col * stepLength + elSize;
      offsetMatrix[1] = firstPositionY + row * stepLength + elSize;
      offsetMatrix[2] = panelIndex * gutter * 2;

      // 通过工具函数生成变换矩阵（平移，旋转）--> 执行顺序 先旋转, 后平移 (注意: 变换从右向左应用)
      matrices[i] = MatrixTools.transform(matrixsArgs);
    }

    /**
     * 注意：返回数组的内部引用
     * 请勿修改数组内矩阵对象的内容，否则会污染缓存。
     */
    GriViewModel.cachedMatrices = matrices;
    return matrices;
  }
}