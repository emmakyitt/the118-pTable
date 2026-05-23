import { VisualModel } from '@/visual/VisualModel';
import { RegVisModel } from '@/utils/RegVisModel';
import { MoStatus, type Matrix3D } from '@/typings';
import MtxTools from '@/utils/matrixTools';

/**
 * 布局模板：遍历行和列,当模板值为"1"时计算元素的平移矩阵
 * 为"0"时表示此为处空白区域,无需计算
 * 
 * 也可通过编写判断语句的方案来替代字符模板，
 * 但需要编写多条语句判断，这会降低代码可读性，
 * 相较而言，使用字符模板则更为直观
 */
const CHAR_TEMPLATE: number[][] = [
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]];

/**
 * Ta 布局模型：用于生成化学元素周期表（表格形态）的点阵布局。
 * 通过装饰器 @RegVisModel 自动将模型注册到 VisualModel.registry 中，
 * 其注册标识与 MoStatus.Ta 枚举值保持一致。
 */
@RegVisModel()
class TaModel extends VisualModel {

  /** 明确声明的模型标识，与 MoStatus 枚举保持一致 */
  static readonly MODEL_STATUS = MoStatus.Ta;

  /** 单个元素格子的基准尺寸（像素/单位） */
  private readonly E_SIZE: number = 52;

  /** 布局最大行数 */
  private readonly ROW_MAX: number = 9;

  /** 布局最大列数 */
  private readonly COL_MAX: number = 18;

  /**
  * 根据元素所在的行列计算其在网格中的特殊偏移量。
  *
  * 用于处理周期表中镧系、锕系以及第 6、8 行元素的错位展示：
  * - 第 5 行（row=5, col>2）：镧系元素（La 及之后）整体向下移动 2 行并左移一格
  * - 第 7 行（row=7, col>2）：锕系元素（Ac 及之后）整体向下移动 1 行并左移一格
  * - 第 6 行（row=6）：第 1~2 列（Hf, Ta）向上移动并右移三格；
  *                   第 3~15 列（W 及之后 12 个元素）向上移动并右移两格；
  *                   其余（Fr, Ra）向左移动 16 格
  * - 第 8 行（row=8, col>2）：Rf 及之后的元素整体向上移动 2 行
  *
  * @param row - 元素所在行
  * @param col - 元素所在列
  * @returns 包含 x 和 y 方向偏移量的对象
  */
  private getSpecialOffset(
    row: number, 
    col: number
  ): { 
    dx: number, 
    dy: number
  } {

    // 存放偏移量
    let dx: number = 0;
    let dy: number = 0;

    // 后两行间距（用于微调）xs 和 ys 的偏移
    let gs: number = 10;

    // 元素大小
    let es: number = this.E_SIZE;

    // 处理镧系（第 5 行，col>2）：下移两行，左移一个单位
    if (row === 5 && col > 2) { dy = es * 2 + gs; dx = -es; }

    // 处理锕系（第 7 行，col>2）：下移一行，左移一个单位
    if (row === 7 && col > 2) { dy = es * 1 + gs; dx = -es; }

    // 处理第 6 行的特殊错位
    if (row === 6) {
      // Hf、Ta：上移一行，右移三格
      if (col < 2) { dy = -es; dx = es * 3; }

      // W 及其后 12 个元素：上移一行，右移两格
      else if (col < 16) { dy = -es; dx = es * 2; }

      // Fr、Ra：左移 16 格
      else { dx = -es * 16; }
    }

    // 处理第 8 行（col>2）：Rf 及其后元素上移两行
    if (row === 8 && col > 2) { dy = -es * 2; }

    return { dx, dy }
  }

  /**
   * 获取当前模型下所有元素的变换矩阵（平移 + 缩放）。
   *
   * 算法：
   * 1. 将整个周期表视为一个 18 列 × 9 行的网格，每个单元格大小为 E_SIZE。
   * 2. 以网格中心为原点，计算出第一个元素（左上角）的基准坐标。
   * 3. 遍历 charTemplate，标记为 1 的位置生成一个元素，并应用特殊的行列偏移（用于La镧系、Ac锕系元素的错位展示）。
   * 4. 使用 MtxTools.transform 将网格坐标转换为 3D 变换矩阵。
   *
   * @returns 变换矩阵数组，每个矩阵对应一个可视元素
   */
  getMatrix3d(): Matrix3D[] {

    // 整个周期表盒子的宽高（网格总尺寸）
    const w_sizeBox: number = this.E_SIZE * this.COL_MAX;
    const h_sizeBox: number = this.E_SIZE * this.ROW_MAX;

    // 第一个元素左上角坐标（使整体居中）
    const x_firstEl: number = -w_sizeBox / 2;
    const y_firstEl: number = -h_sizeBox / 2;

    // 存放通过遍历计算得到的元素变换矩阵
    const matrix3dGroup: Matrix3D[] = [];

    // 遍历模板生成矩阵
    for (let row=0; row<this.ROW_MAX; row++) {
      for (let col=0; col<this.COL_MAX; col++) {

        // 剔除空白区域, 仅计算模板中标记为1的元素
        if(!!CHAR_TEMPLATE[row][col]) {

          // 获取特殊偏移量（用于La镧系/Ac锕系等调整）
          const { dx, dy } = this.getSpecialOffset(row, col);

          // 元素在网格中的绝对坐标: 第一个元素左上角坐标 + 行列数值 * 元素大小 + 特殊偏移量
          const tx: number = x_firstEl + col * this.E_SIZE + dx;
          const ty: number = y_firstEl + row * this.E_SIZE + dy;

          // 通过工具函数生成变换矩阵: 元素平移到 (tx, ty) 并缩放(!默认值，不缩放)
          const matrix3d: Matrix3D = MtxTools.transform([[tx,ty,0,0], [1, 1, 1, 2]]);
          matrix3dGroup.push(matrix3d);
        }
      }
    }

    return matrix3dGroup;
  }
}

export default TaModel;