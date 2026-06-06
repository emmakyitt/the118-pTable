import VisualModelFactory from '@/visual/VisualModelFactory';
import registerToVisualModelFactory from '@/visual/register';
import type { Matrix, Matrix3D } from '@/typings';
import { MoStatus } from '@/typings';
import MatrixTools from '@/utils/MatrixTools';
import charTemplate from '@/assets/charTemplate';

/**
 * 布局模型（TaModel）：生成化学元素周期表（表格形态）的点阵布局。
 * 
 * 通过装饰器 @registerToVisualModelFactory 自动注册到 VisualModelFactory.registry，
 * 注册标识与 MoStatus.Ta 枚举值一致
 * 
 * 优化点：
 * - 所有布局常量（尺寸、间距、行列数）均为静态只读属性，初始化后不再变化。
 * - 表格总尺寸及第一个元素基准坐标提前静态计算，避免运行时重复运算。
 * - `getSpecialOffset` 改为静态方法，减少开销。
 * - 变换矩阵结果采用静态缓存，首次计算后直接复用。
 * - 循环内部缓存数组引用和坐标基准值，减少属性访问链。
 */
@registerToVisualModelFactory()
export default class TaModel extends VisualModelFactory {

  /** 明确声明的模型标识，与 MoStatus 枚举保持一致 */
  static readonly MODEL_STATUS = MoStatus.Ta;

  /** 元素总个数（化学元素周期表全部已知元素） */
  private static readonly ELEMENT_COUNT: number = 118;

  /** 单个元素的基准尺寸（像素） */
  private static readonly ELEMENT_SIZE: number = 50;

  /** 布局最大行数 */
  private static readonly ROW_MAX: number = 9;

  /** 布局最大列数 */
  private static readonly COL_MAX: number = 18;

  /** 元素间的空隙 */
  private static readonly GUTTER: number = 5;

  /** 镧系/锕系与上方主表之间的额外间距 */
  private static readonly LAN_ACT_GAP: number = 10;

  /** 无特殊偏移时使用 避免每次循环创建新对象 */
  private static readonly ZERO_OFFSET: { dx: number; dy: number } = Object.freeze({ dx: 0, dy: 0 });

  /** 整个周期表的表格总尺寸（宽 × 高） */
  private static readonly TABLE_SIZE: { w: number; h: number } = {
    w: (TaModel.ELEMENT_SIZE + TaModel.GUTTER) * TaModel.COL_MAX,
    h: (TaModel.ELEMENT_SIZE + TaModel.GUTTER) * TaModel.ROW_MAX,
  };

  /**
   * 第一个元素（左上角起始元素）的基准坐标。
   * 以表格中心为原点，将网格整体居中。
   */
  private static readonly FIRST_ELEMENT_POSITION: { x: number; y: number } = {
    x: -TaModel.TABLE_SIZE.w / 2 + TaModel.ELEMENT_SIZE / 2,
    y: -TaModel.TABLE_SIZE.h / 2 + TaModel.ELEMENT_SIZE / 2,
  };

  // ==================== 缓存区域 ====================
  
  /** 变换矩阵缓存，首次计算后存储，避免重复生成 */
  private static cachedMatrices: Matrix3D[] | null = null;


  // ==================== 静态计算方法 ====================

  /**
  * 根据元素所在的行列计算其在网格中的特殊偏移量。
  *
  * 用于处理周期表中镧系、锕系以及第 6、8 行元素的错位展示：
  * - 第 5 行（i=5, j>2）：镧系元素（La 及之后）整体向下移动 2 行并左移一格
  * - 第 7 行（i=7, j>2）：锕系元素（Ac 及之后）整体向下移动 1 行并左移一格
  * - 第 6 行（i=6）：第 1~2 列（Hf, Ta）向上移动并右移三格；
  *                   第 3~15 列（W 及之后 12 个元素）向上移动并右移两格；
  *                   其余（Fr, Ra）向左移动 16 格
  * - 第 8 行（i=8, j>2）：Rf 及之后的元素整体向上移动 2 行
  *
  * @param i - 元素所在行
  * @param j - 元素所在列
  * @returns 包含 x 和 y 方向额外偏移量的对象
  */
  private static getSpecialOffset(
    i: number, 
    j: number,
    step: number, // 元素尺寸
    lanActGap: number
  ): { 
    dx: number, 
    dy: number
  } {

    // 镧系（第 6 周期）
    if (i === 5 && j > 2) return { dy: step * 2 + lanActGap, dx: -step }

    // 锕系（第 7 周期）
    if (i === 7 && j > 2) return { dy: step * 1 + lanActGap, dx: -step }

    // 第 6 行特殊错位
    if (i === 6) {
      if (j < 2) return { dy: -step, dx: step * 3 }
      else if (j < 16) return { dy: -step, dx: step * 2 } 
      else return { dx: -step * 16, dy: 0 }
    }

    // 第 8 行（Rf 及以后）
    if (i === 8 && j > 2) { return { dx: 0, dy: -step * 2 } }

    // 无特殊偏移
    return TaModel.ZERO_OFFSET;
  }


  // ==================== 公共接口 ====================
  
  /**
   * 获取当前模型下所有元素的 3D 变换矩阵（平移）。
   *
   * 算法：
   * 1. 将周期表视为 18 列 × 9 行 的网格，步长 = 元素尺寸 + 间隙。
   * 2. 以网格中心为原点，计算出第一个元素（左上角）的基准坐标。
   * 3. 遍历布局模板 `CHAR_TEMPLATE`，对标记为 1 的格子计算元素绝对坐标，
   *    并叠加 `getSpecialOffset` 提供的特殊偏移。
   * 4. 使用 `MatrixTools.transform` 生成平移变换矩阵。
   *
   * 缓存策略：首次调用后结果保存在 `cachedMatrices` 静态属性中，
   * 后续调用直接返回缓存，避免重复遍历与矩阵运算。
   *
   * @returns 变换矩阵数组，每个矩阵对应一个可视元素
   */
  getMatrix3d(): Matrix3D[] {

    // 命中缓存直接返回
    if (TaModel.cachedMatrices) {
      return TaModel.cachedMatrices;
    }

    // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const matrices: Matrix3D[] = new Array<Matrix3D>(TaModel.ELEMENT_COUNT);

    // 第一个元素位置
    const firstElementX: number = TaModel.FIRST_ELEMENT_POSITION.x;
    const firstElementY: number = TaModel.FIRST_ELEMENT_POSITION.y;

    // 后两行垂直间隙 (提升局部常量 避免内部循环重复访问静态属性)
    const lanActGap: number = TaModel.LAN_ACT_GAP;

    // 每步跨度（单位 / 像素）
    const step: number = TaModel.ELEMENT_SIZE + TaModel.GUTTER;

    // 获取特殊偏移量方法
    const specialOffset: Function = TaModel.getSpecialOffset;

    // 布局字符模板
    const cTemplate: number[][] = charTemplate; // 局部缓存引用

    // 平移矩阵
    const offsetMatrix: Matrix = [0, 0, 0, 0];
    
    // 缩放矩阵
    const scalesMatrix: Matrix = [.5, .5, 1, 2];

    // 矩阵变换参数 [缩放，平移]
    const matrixsArgs: Matrix[] = [scalesMatrix, offsetMatrix];

    // 最大行 / 列
    const rowMax: number = TaModel.ROW_MAX;
    const colMax: number = TaModel.COL_MAX;

    // 记录循环次数
    let idx: number = 0;

    // 遍历模板生成矩阵
    for (let i=0; i<rowMax; i++) {

      // 元素在 Y轴的基准坐标
      const offsetY: number = firstElementY  + i * step;

      for (let j=0; j<colMax; j++) {

        // 剔除空白区域, 仅计算模板中标记为1的元素
        if(cTemplate[i][j]) {

          // 获取特殊偏移量（用于La镧系/Ac锕系等调整）
          const { dx, dy } = specialOffset(i, j, step, lanActGap);

          // 第一个元素左上角坐标 + (当前循环数 * 每步跨度) + 特殊偏移量(dx / dy)
          offsetMatrix[0] = firstElementX  + j * step + dx; // 元素 X轴坐标
          offsetMatrix[1] = offsetY + dy, // 元素 Y轴坐标;

          // 通过矩阵工具函数生成变换矩阵
          matrices[idx++] = MatrixTools.transform(matrixsArgs)

        }
      }
    }

    /**
     * 注意：返回的数组为数组引用，可以安全遍历，
     * 但请勿修改数组内矩阵对象的内容，否则会污染缓存。
     */
    TaModel.cachedMatrices = matrices;
    return matrices;
  }
}