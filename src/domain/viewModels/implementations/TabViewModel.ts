import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import charTemplate from '@/assets/data/charTemplate';
import { LayoutStyle } from '@/domain/typings/viewModels';
import { cardsWrapDfltMatix3d } from '@/domain/viewModels';


// ==================== 表格布局常量 ====================

const ROW_MAX: number = 9;                  // 布局最大行数
const COL_MAX: number = 18;                 // 布局最大列数
const ELEMENT_SIZE:  number = 50;           // 单个元素的基准尺寸（像素）
const ELEMENT_COUNT: number = 118;          // 元素总个数（化学元素周期表全部已知元素）
const LAN_ACT_GAP: number = 10;             // 镧系/锕系与上方主表之间的额外垂直间距（像素）
const GUTTER: number = 5;                   // 相邻元素之间的间隙（像素）

/**
 * 整个周期表的表格总尺寸（宽 × 高）
 */
const TABLE_SIZE_W: number = (ELEMENT_SIZE + GUTTER) * COL_MAX;
const TABLE_SIZE_H: number = (ELEMENT_SIZE + GUTTER) * ROW_MAX;

/**
 * 第一个元素（左上角起始元素）的基准坐标
 * 以表格中心为原点，将网格整体居中，并偏移半个元素尺寸使元素中心对齐网格点
 */
const FIRST_CARD_X: number = -TABLE_SIZE_W / 2 + ELEMENT_SIZE / 2;
const FIRST_CARD_Y: number = -TABLE_SIZE_H / 2 + ELEMENT_SIZE / 2;

/**
 * 根据元素所在的行列计算其在网格中的特殊偏移量
 *
 * 用于处理周期表中镧系、锕系以及第 6、8 行元素的错位展示：
 * - 第 6 行（i=5, j>2）：镧系元素（La 及之后）整体向下移动 2 行并左移一格
 * - 第 8 行（i=7, j>2）：锕系元素（Ac 及之后）整体向下移动 1 行并左移一格
 * - 第 7 行（i=6）     ：第 1~2 列（Hf, Ta）向上移动并右移三格；
 *                      第 3~15 列（W 及之后 12 个元素）向上移动并右移两格；
 *                      其余（Fr, Ra）向左移动 16 格
 * - 第 9 行（i=8, j>2）：Rf 及之后的元素整体向上移动 2 行
 *
 * @param i - 元素所在行（0 起始）
 * @param j - 元素所在列（0 起始）
 * @param step - 每一步的跨度（元素尺寸 + 间隙，单位：像素）
 * @returns {{ dx: number, dy: number }} 包含 x 和 y 方向的额外偏移量（像素）
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
  if (i === 7 && j > 2) return { dx: -step,       dy: step * 1 + LAN_ACT_GAP }  // 锕系（第 8 周期）

  if (i === 6) {                                                                // 第 7 行特殊错位
    if (j < 2)          return { dx: step  * 3,   dy: -step }
    else if (j < 16)    return { dx: step  * 2,   dy: -step } 
    else                return { dx: -step * 16,  dy: 0 }
  }

  if (i === 8 && j > 2) return { dx: 0, dy: -step * 2 }                         // 第 9 行（Rf 及之后）
  return { dx: 0, dy: 0 };                                                      // 无特殊偏移
}

/**
 * 布局模型：TabViewModel（Table 表格模型）
 *
 * 生成化学元素周期表的标准表格布局：
 * - 使用 9 行 × 18 列的网格，步长 = 元素尺寸 + 间隙
 * - 根据模板 `charTemplate` 标记有效元素位置，跳过空白格
 * - 应用特殊偏移（镧系/锕系错位、第 6/8 行调整）以符合标准周期表外观
 * - 每个卡片应用固定缩放（0.5 倍），仅包含平移和缩放，无旋转
 *
 * 通过装饰器 @registerTo 将该模型注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.TAB 枚举值一致
 */
@registerTo(ViewModelFactory)
export default class TabViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle.TAB 保持一致，
   * 用于工厂模式识别当前模型
   */
  static readonly LAYOUT_STYLE = LayoutStyle.TAB;


  // ==================== 缓存区域 ====================
   /**
   * 缓存所有卡片的 3D 变换矩阵（Matrix3d[]）
   * 首次计算后存储，后续调用直接复用，避免重复计算
   * 注意：矩阵对象为不可变引用，外部不应修改其内容，否则会污染缓存
   */
  private static cachedMatrices: Matrix3d[];
  

  // ==================== 公共接口 ====================
  /**
   * 计算当前模型下所有卡片元素的独立 3D 变换矩阵
   *
   * 算法步骤：
   * 1. 若缓存存在，直接返回缓存引用
   * 2. 遍历 9 行 × 18 列网格，仅处理模板中标记为 1 的有效位置
   * 3. 对每个有效位置：
   *    - 计算基础坐标（基于网格中心原点）
   *    - 调用 `getSpecialOffset` 获取特殊偏移（处理镧系/锕系等）
   *    - 构建变换参数数组 [缩放, 平移]（无旋转）
   *    - 调用 MatrixTools.transform 生成矩阵（执行顺序：平移 → 缩放）
   * 4. 缓存结果，返回矩阵数组
   *
   * @returns {Matrix3d[]} 卡片元素的 3D 变换矩阵数组，顺序与元素索引一一对应
   *
   * @remarks
   * - 矩阵数组严格按元素顺序排列（由模板遍历顺序决定），总数为 118
   * - 由于使用静态缓存，所有实例共享同一计算结果
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    // 命中缓存直接返回
    if (TabViewModel.cachedMatrices) {
      return TabViewModel.cachedMatrices;
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

          // 计算元素坐标（基础坐标 + 特殊偏移）
          offsetMatrix[0] = FIRST_CARD_X  + j * step + dx;              // 元素 X轴坐标
          offsetMatrix[1] = offsetY + dy;                               // 元素 Y轴坐标

          // 生成变换矩阵（执行顺序：先平移，后缩放）
          matrices[idx++] = MatrixTools.transform(matrixsArgs);         
        }
      }
    }

    // 缓存计算结果
    TabViewModel.cachedMatrices = matrices;
    return matrices;
  }

  /**
   * 根据选中的卡片 ID 计算整个卡片容器的 3D 变换矩阵
   *
   * 该矩阵用于使选中的卡片移动到视觉焦点（屏幕中心）
   * 算法基于目标卡片的平移参数：
   * 1. 若 elementId 为 0（取消选中），返回单位矩阵（无变换）
   * 2. 否则，获取目标卡片的变换矩阵，提取平移向量，反向平移使卡片中心移至原点，
   *    并沿 Z 轴正向平移 250 像素，使卡片浮于视野前方
   *
   * @param elementId - 被选中的卡片 ID（从 1 开始，传入 0 表示取消选中）
   * @returns {Matrix3d} 容器整体的 3D 变换矩阵
   */
  public calcCardsWrapMatrix3d (elementId: number): Matrix3d {

    // 取消选中时，容器恢复初始状态
    if(!elementId) return cardsWrapDfltMatix3d[TabViewModel.LAYOUT_STYLE];

    // 从缓存中获取目标卡片的完整变换矩阵（直接引用，不修改）
    const cardTransform: Matrix3d = TabViewModel.cachedMatrices[elementId-1];

    /**
     * 卡片容器变换矩阵:
     * 1. 反向平移（将卡片中心移至原点）
     * 2. 沿 Z 轴正向平移 250 像素，使卡片浮在视野前方
     */
    return MatrixTools.offset([-cardTransform[3][0], -cardTransform[3][1], 250, 0]);
  }
}