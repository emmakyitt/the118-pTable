import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import charTemplate from '@/assets/data/charTemplate';
import { LayoutStyle } from '@/domain/typings/viewModels';


const ROW_MAX: number = 9;                  // 布局最大行数
const COL_MAX: number = 18;                 // 布局最大列数
const ELEMENT_SIZE:  number = 50;           // 单个元素的基准尺寸（像素）
const ELEMENT_COUNT: number = 118;          // 元素总个数（化学元素周期表全部已知元素）
const LAN_ACT_GAP: number = 10;             // 镧系/锕系与上方主表之间的额外间距
const GUTTER: number = 5;                   // 元素间的空隙

/**
 * 整个周期表的表格总尺寸（宽 × 高）
 */
const TABLE_SIZE_W: number = (ELEMENT_SIZE + GUTTER) * COL_MAX;
const TABLE_SIZE_H: number = (ELEMENT_SIZE + GUTTER) * ROW_MAX;

/**
 * 第一个元素（左上角起始元素）的基准坐标。
 * 以表格中心为原点，将网格整体居中。
 */
const FIRST_CARD_X: number = -TABLE_SIZE_W / 2 + ELEMENT_SIZE / 2;
const FIRST_CARD_Y: number = -TABLE_SIZE_H / 2 + ELEMENT_SIZE / 2;

/**
 * 根据元素所在的行列计算其在网格中的特殊偏移量
 *
 * 用于处理周期表中镧系、锕系以及第 6、8 行元素的错位展示：
 * - 第 5 行（i=5, j>2）：镧系元素（La 及之后）整体向下移动 2 行并左移一格
 * - 第 7 行（i=7, j>2）：锕系元素（Ac 及之后）整体向下移动 1 行并左移一格
 * - 第 6 行（i=6）     ：第 1~2 列（Hf, Ta）向上移动并右移三格；
 *                      第 3~15 列（W 及之后 12 个元素）向上移动并右移两格；
 *                      其余（Fr, Ra）向左移动 16 格
 * - 第 8 行（i=8, j>2）：Rf 及之后的元素整体向上移动 2 行
 *
 * @param i - 元素所在行
 * @param j - 元素所在列
 * @returns 包含 x 和 y 方向额外偏移量的对象
 */
function getSpecialOffset (
  i: number, 
  j: number,
  step: number
): { 
  dx: number, 
  dy: number
} {

  if (i === 5 && j > 2) return { dx: -step,       dy: step * 2 + LAN_ACT_GAP }  // 镧系（第 6 周期）
  if (i === 7 && j > 2) return { dx: -step,       dy: step * 1 + LAN_ACT_GAP }  // 锕系（第 7 周期）

  if (i === 6) {                                                                // 第 6 行特殊错位
    if (j < 2)          return { dx: step  * 3,   dy: -step }
    else if (j < 16)    return { dx: step  * 2,   dy: -step } 
    else                return { dx: -step * 16,  dy: 0 }
  }

  if (i === 8 && j > 2) return { dx: 0, dy: -step * 2 }                         // 第 8 行（Rf 及之后）
  return { dx: 0, dy: 0 };                                                      // 无特殊偏移
}


/**
 * 布局模型（SphViewModel）：生成化学元素周期表（表格形态）的点阵布局
 * 
 * 通过装饰器 @registerTo 将 SphViewModel 注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.TAB 枚举值一致
 * 
 * 优化点：
 * - 所有布局常量（尺寸、间距、行列数）均为静态只读属性，初始化后不再变化
 * - 表格总尺寸及第一个元素基准坐标提前静态计算，避免运行时重复运算
 * - `getSpecialOffset` 改为静态方法，减少开销
 * - 变换矩阵结果采用静态缓存，首次计算后直接复用
 * - 循环内部缓存数组引用和坐标基准值，减少属性访问链
 */
@registerTo(ViewModelFactory)
export default class SphViewModel extends ViewModelFactory {

  /**
   *  明确声明的模型标识，与 LayoutStyle 枚举保持一致 
   */
  static readonly LAYOUT_STYLE = LayoutStyle.TAB;


  // ==================== 缓存区域 ====================
  /**
   *  变换矩阵缓存，首次计算后存储，避免重复生成 
   */
  private static cachedMatrices: Matrix3d[];
  

  // ==================== 公共接口 ====================
  /**
   * 计算当前模型下所有卡片元素的变换矩阵（平移 + 缩放）
   *
   * 算法：
   * 1. 将周期表视为 18 列 × 9 行 的网格，步长 = 元素尺寸 + 间隙
   * 2. 以网格中心为原点，计算出第一个元素（左上角）的基准坐标
   * 3. 遍历布局模板 `CHAR_TEMPLATE`，对标记为 1 的格子计算元素绝对坐标，
   *    并叠加 `getSpecialOffset` 提供的特殊偏移
   * 4. 使用 `MatrixTools.transform` 生成平移变换矩阵
   *
   * 缓存策略：首次调用后结果保存在 `cachedMatrices` 静态属性中，
   * 后续调用直接返回缓存，避免重复遍历与矩阵运算
   *
   * @returns Matrix3d[] 卡片元素的变换矩阵数组
   * 每个矩阵描述了对应卡片元素的局部变换，其中平移部分决定其位置
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    // 命中缓存直接返回
    if (SphViewModel.cachedMatrices) {
      return SphViewModel.cachedMatrices;
    }

    const offsetMatrix: Matrix = [0, 0, 0, 0];                          // 平移矩阵
    const scalesMatrix: Matrix = [.5, .5, 1, 2];                        // 缩放矩阵
    const matrixsArgs: Matrix[] = [scalesMatrix, offsetMatrix];         // 矩阵变换参数 [缩放，平移]
    const matrices:  Matrix3d[] = new Array<Matrix3d>(ELEMENT_COUNT);   // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const step: number = ELEMENT_SIZE + GUTTER;                         // 每步跨度（单位 / 像素）
    let idx: number = 0;                                                // 记录数组下标

    for (let i=0; i<ROW_MAX; i++) {

      // 元素在 Y轴的基准坐标
      const offsetY: number = FIRST_CARD_Y  + i * step;

      for (let j=0; j<COL_MAX; j++) {

        // 剔除空白区域, 仅计算模板中标记为1的元素
        if(charTemplate[i][j]) {

          // 获取特殊偏移量（用于La镧系/Ac锕系等调整）
          const { dx, dy } = getSpecialOffset(i, j, step);

          // 第一个元素左上角坐标 + (当前循环数 * 每步跨度) + 特殊偏移量(dx / dy)
          offsetMatrix[0] = FIRST_CARD_X  + j * step + dx;              // 元素 X轴坐标
          offsetMatrix[1] = offsetY + dy;                               // 元素 Y轴坐标

          // 通过工具函数生成变换矩阵 [缩放，平移]--> 执行顺序 先平移, 后缩放 (注意: 变换从右向左应用)
          matrices[idx++] = MatrixTools.transform(matrixsArgs);         
        }
      }
    }

    /**
     * 注意：返回的数组为数组引用，可以安全遍历，
     * 但请勿修改数组内矩阵对象的内容，否则会污染缓存
     */
    SphViewModel.cachedMatrices = matrices;
    return matrices;
  }

  public calcCardsWrapMatrix3d (): Matrix3d {
    return MatrixTools.identityMatrix();
  }
}