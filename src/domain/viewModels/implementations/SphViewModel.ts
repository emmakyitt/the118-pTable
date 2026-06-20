import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import MathTools from '@/infrastructure/utils/MathTools';
import { LayoutStyle } from '@/domain/typings/viewModels';


// ==================== 球形布局常量 ====================

const ELEMENT_COUNT: number = 118;                                      // 元素总个数（化学元素周期表全部已知元素）
const Z_AXIS_OFFSET: Matrix = Object.freeze([0, 0, 250, 0]) as Matrix;  // Z 轴偏移量（球体半径，即元素离球心的距离）
const SCALE_MATRIX:  Matrix = Object.freeze([.5, .5, 1, 2]) as Matrix;  // 每个卡片的缩放系数（X、Y 方向 0.5 倍)

/**
 * 计算球面分布所需的纬度角度和每个纬度圈上的元素个数
 *
 * 算法概要：
 * 1. 将北半球从北极（90°）到赤道（0°）划分为 4 个纬度圈（含北极点），
 *    角度间隔 d = 180/7 ≈ 25.714°，即纬度值为 [90°, 90°-d, 90°-2d, 90°-3d]。
 * 2. 除北极点外，其余三个纬度圈上的元素数量按纬度余弦值加权分配，
 *    使赤道附近（cos 值较大）容纳更多元素
 * 3. 南北半球对称：南半球的纬度值为北半球的负值，且元素数量分布对称
 * 4. 最终返回 8 组数据（4 北 + 4 南），总和为 118
 *
 * @returns {{ elementsAngle: number[]; elementsDistr: number[] }}
 *   - elementsAngle: 每组对应的纬度角度（角度制，北正南负），长度 8
 *   - elementsDistr: 每个纬度圈上的元素个数，长度 8，总和为 ELEMENT_COUNT
 *
 * @remarks
 * - 北极点（90°）仅分配 1 个元素（代表最顶端的元素）
 * - 赤道附近（0°附近）分配的元素最多（约总元素的一半），形成疏密有致的视觉效果
 */
function getSphereArrays (): {
  elementsAngle: number[],
  elementsDistr: number[]
} {

  const d = 180 / 7;                                 // 纬度间隔（度）
  const t = ELEMENT_COUNT / 2 - 1;                   // 北半球除极点外的元素总数（118/2 - 1 = 58）
  const latN = [90, 90 - d, 90 - 2 * d, 90 - 3 * d]; // 北半球四个纬度（从北极点到赤道附近）

  // 除极点外各纬度的余弦值（角度转弧度）
  const cosines: number[] = latN.slice(1).map(d => MathTools.cosineByAngle(d)); 

  // 根据余弦值加权分配元素数量（使赤道附近密度更高）
  const rFactor: number = t / cosines.reduce((a, b) => a + b, 0);
  const counter: number[] = [1, ...cosines.map(i => Math.round(rFactor * i))];

  // 南北对称拼接
  const sphereArrays = {
    elementsAngle: [...latN, ...latN.reverse().map(i => -i)],  // 每组绕 X 轴的旋转角度（角度制）
    elementsDistr: [...counter, ...counter.reverse()],
  };

  return sphereArrays;
}


/**
 * 布局模型：SphViewModel（Sphere 球体模型）
 *
 * 生成化学元素周期表的球体分布布局：
 * - 所有元素分布在球面上（半径为 250 像素）
 * - 纬度方向采用不均匀分布：极区稀疏、赤道密集（通过余弦加权分配元素数量）
 * - 每个纬度圈内的元素在经度方向均匀分布
 * - 每个卡片应用固定缩放（0.5 倍）和球面旋转（绕 X 轴倾斜 + 绕 Y 轴旋转）
 *
 * 通过装饰器 @registerTo 将该模型注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.SPH 枚举值一致
 */
@registerTo(ViewModelFactory)
export default class SphViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle.SPH 保持一致，
   * 用于工厂模式识别当前模型。
   */
  static readonly LAYOUT_STYLE = LayoutStyle.SPH;


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
   * 1. 若缓存存在，直接返回缓存引用
   * 2. 调用 `getSphereArrays()` 获取每个纬度圈的角度和元素数量分布
   * 3. 遍历每个纬度圈，对圈内每个元素：
   *    - 计算其绕 X 轴的倾斜角度（纬度角，固定值）
   *    - 计算其绕 Y 轴的旋转角度（经度角，在圈内均匀分布）
   *    - 构建变换参数数组 [缩放, 平移, 旋转]（平移固定为 Z 轴偏移 250）
   *    - 调用 MatrixTools.transform 生成最终矩阵（执行顺序：旋转 → 平移 → 缩放）
   * 4. 缓存结果，返回矩阵数组
   *
   * @returns {Matrix3d[]} 卡片元素的 3D 变换矩阵数组，顺序按纬度组排列，总数为 118
   *
   * @remarks
   * - 由于使用静态缓存，所有实例共享同一计算结果
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    // 命中缓存则直接返回引用，不再生成额外数组副本
    if (SphViewModel.cachedMatrices) {
      return SphViewModel.cachedMatrices;
    }

    const rotateArray: Matrix   = [0, 0, 0, 1];                                 // 复用临时数组，避免在循环内重复创建新数组对象
    const matrixsArgs: Matrix[] = [SCALE_MATRIX, Z_AXIS_OFFSET, rotateArray];   // 矩阵变换参数 [缩放, 平移，旋转]
    const matrices:  Matrix3d[] = new Array<Matrix3d>(ELEMENT_COUNT);           // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const cardsTra:  Matrix[][] = new Array<Matrix[]>(ELEMENT_COUNT);           // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const { elementsAngle, elementsDistr } = getSphereArrays();                 // 获取球面分布所需的纬度和每个纬度圈上的元素个数
    let idx: number = 0;                                                        // 记录数组下标

    for (let i=0; i<elementsDistr.length; i++) {

      // 当前循环元素排布数量
      const count = elementsDistr[i];

      // 提前计算每个纬度组的角度与步长，消除循环内重复运算
      const rotateX = -elementsAngle[i];  // 绕 X 轴的倾斜角度（负值表示向下倾斜）
      const step_Y = 360 / count;         // 经度步长（度）

      for (let j=0; j<count; j++, idx++) {

        // 设置当前元素的旋转角度（绕 X 轴固定，绕 Y 轴按步长递增）
        rotateArray[0] = rotateX;
        rotateArray[1] = step_Y * j - 180; // 起始角度偏转 -180°，使元素均匀分布

        // 生成变换矩阵（执行顺序：旋转 → 平移 → 缩放）
        matrices[idx] = MatrixTools.transform(matrixsArgs);
        cardsTra[idx] = structuredClone(matrixsArgs);  // 深拷贝变换参数，保存当前状态用于后续容器变换计算
      }
    }

    // 缓存计算结果
    SphViewModel.cachedMatrices = matrices;
    SphViewModel.cardsTransform = cardsTra;

    return matrices;
  }

  /**
   * 根据选中的卡片 ID 计算整个卡片容器的 3D 变换矩阵
   *
   * 该矩阵用于使选中的卡片移动到视觉焦点（屏幕中心）
   * 算法基于目标卡片的旋转参数：
   * 1. 若 elementId 为 0（取消选中），返回整体缩放矩阵（0.6 倍），使球体略微缩小
   * 2. 否则，获取目标卡片的变换参数，分别绕 Y 轴和 X 轴反向旋转，
   *    抵消卡片自身的旋转，使卡片正面朝向观察者
   *
   * @param elementId - 被选中的卡片 ID（从 1 开始，传入 0 表示取消选中）
   * @returns {Matrix3d} 容器整体的 3D 变换矩阵
   */
  public calcCardsWrapMatrix3d (elementId: number): Matrix3d {

    // 取消选中时，整体缩放 0.6 倍，表示球体退离焦点
    if(!elementId) return MatrixTools.scale([.6, .6, 1, 2]);

    // 获取目标卡片的变换参数 [缩放, 平移, 旋转]
    const cardTransform: Matrix[] = SphViewModel.cardsTransform[elementId-1];

    /**
     * 卡片容器变换矩阵:
     * 1. 绕 Y 轴反向旋转（抵消经度旋转）
     * 2. 绕 X 轴反向旋转（抵消纬度倾斜）
     */
    return MatrixTools.multiply(
      MatrixTools.rotateY(-cardTransform[2][1]),
      MatrixTools.rotateX(-cardTransform[2][0])
    )
  }
}