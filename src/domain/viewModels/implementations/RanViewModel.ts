import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import MathTools from '@/infrastructure/utils/MathTools';
import { LayoutStyle } from '@/domain/typings/viewModels';
import { ViewModelService } from '@/domain/services/ViewModelService';
import { cardsWrapDfltMatix3d } from '@/domain/viewModels';


// ==================== 随机布局常量 ====================

const ELEMENT_COUNT: number = 118;  // 元素总个数（化学元素周期表全部已知元素）

/**
 * 获取当前视口（浏览器窗口）的宽度和高度
 * 兼容 clientWidth / innerWidth 的差异，优先使用 `window.innerWidth`
 *
 * @returns 包含宽高的对象 `{ w: number, h: number }`
 */
function getViewportSize (): { w: number, h: number} {
    return { 
      w: window.innerWidth || 
         document.documentElement.clientWidth || 
         document.body.clientWidth,
      h: window.innerHeight || 
         document.documentElement.clientHeight || 
         document.body.clientHeight
   };
  }

/**
 * 布局模型: RanViewModel（Random 随机模型）
 *
 * 生成化学元素周期表的随机散点布局：
 * - 每个元素在 X、Y、Z 三个维度上独立均匀随机分布
 * - X 和 Y 的范围基于当前视口尺寸动态计算（约 视口尺寸/3）
 * - Z 的范围固定为 [-200, 200]（像素）
 * 
 * 通过装饰器 @registerTo 将 RanViewModel 注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.RAN 枚举值一致
 */
@registerTo(ViewModelFactory)
export default class RanViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle.RAN 保持一致，
   * 用于工厂模式识别当前模型
   */
  static readonly LAYOUT_STYLE = LayoutStyle.RAN;


  // ==================== 公共接口 ====================
  /**
   * 计算当前模型下所有卡片元素的独立 3D 变换矩阵
   *
   * 算法步骤：
   * 1. 获取当前视口尺寸（用于限制随机分布的范围）
   * 2. 为每个元素（共 118 个）生成独立随机坐标：
   *    - X 坐标：在 `[-viewportW/3, +viewportW/3]` 范围内均匀随机
   *    - Y 坐标：在 `[-viewportH/3, +viewportH/3]` 范围内均匀随机
   *    - Z 坐标：在 `[-200, 200]` 范围内均匀随机
   * 3. 构建变换参数数组 [缩放, 平移]（无旋转），调用 MatrixTools.transform 生成矩阵
   * 4. 不进行缓存，每次调用均重新生成随机位置
   *
   * @returns {Matrix3d[]} 卡片元素的 3D 变换矩阵数组，顺序与元素索引一一对应
   */
  public calcCardsMatrix3d (): Matrix3d[] {

    const offsetMatrix:  Matrix = [0, 0, 0, 0];                             // 平移矩阵
    const scalesMatrix:  Matrix = [.5, .5, 1, 2];                           // 缩放矩阵
    const matrixsArgs: Matrix[] = [scalesMatrix, offsetMatrix];             // 矩阵变换参数 [缩放，平移]
    const matrices:  Matrix3d[] = new Array<Matrix3d>(ELEMENT_COUNT);       // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const randomInt: Function = MathTools.randomInt;                        // 获取随机整数方法
    const viewportW: number = getViewportSize().w;                          // 浏览器窗口宽 / 高度
    const viewportH: number = getViewportSize().h;

    // 为每个元素生成独立随机的三维坐标 
    for (let i:number = 0; i < ELEMENT_COUNT; i++) {

      // 随机坐标范围：X、Y 以视口尺寸的 1/3 为限，Z 在 [-200, 200] 之间
      offsetMatrix[0] = randomInt(-viewportW / 3, viewportW / 3);
      offsetMatrix[1] = randomInt(-viewportH / 3, viewportH / 3);
      offsetMatrix[2] = randomInt(-200, 200);

      // 生成变换矩阵 [缩放, 平移] --> 执行顺序：先平移，后缩放（变换从右向左应用）
      matrices[i] = MatrixTools.transform(matrixsArgs);
    }

    return matrices;
  }

  /**
   * 根据选中的卡片 ID 计算整个卡片容器的 3D 变换矩阵
   *
   * 该矩阵用于使选中的卡片移动到视觉焦点（屏幕中心）
   * 算法基于目标卡片当前在 `ViewModelService.lastCardsMatrix3d` 中缓存的矩阵
   * 1. 若 elementId 为 0（取消选中），返回单位矩阵（无变换）
   * 2. 否则，获取目标卡片的变换矩阵，提取其中的平移分量，反向平移使卡片中心移至原点，
   *    再沿 Z 轴正向平移 250 像素，使卡片浮于视野前方
   *
   * @param elementId - 被选中的卡片 ID（从 1 开始，传入 0 表示取消选中）
   * @returns {Matrix3d} 容器整体的 3D 变换矩阵
   */
  public calcCardsWrapMatrix3d (elementId: number): Matrix3d {

    // 取消选中时，容器恢复初始状态
    if(!elementId) return cardsWrapDfltMatix3d[RanViewModel.LAYOUT_STYLE];

    // 从ViewModel服务缓存中获取目标卡片的完整变换矩阵
    const cardTransform: Matrix3d = ViewModelService.lastCardsMatrix3d[elementId-1];

    /**
     * 卡片容器变换矩阵:
     * 1. 反向平移（将卡片中心移动到世界原点）
     * 2. 沿 Z 轴正向平移 250 像素，使卡片浮在视野前方
     */
    return MatrixTools.multiply(
      MatrixTools.offset([-cardTransform[3][0], -cardTransform[3][1], -cardTransform[3][2], 0]),
      MatrixTools.offsetZ(250)
    )
  }
}