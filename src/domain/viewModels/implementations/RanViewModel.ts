import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';
import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import registerTo from '@/domain/viewModels/register';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import MathTools from '@/infrastructure/utils/MathTools';
import { LayoutStyle } from '@/domain/typings/viewModels';


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
 * 布局模型（RanViewModel）：生成化学元素周期表（随机形态）的点阵布局
 *
 * 该类生成的 3D 点阵中，每个元素的位置在 X、Y、Z 轴上均独立随机分布，
 * 不遵循任何周期性或对称规律，适用于“随机云雾”或“散点”形态的可视化场景
 *  
 * 通过装饰器 @registerTo 将 RanViewModel 注册到 ViewModelFactory.registry 中，
 * 注册标识与 LayoutStyle.RAN 枚举值一致
 */
@registerTo(ViewModelFactory)
export default class RanViewModel extends ViewModelFactory {

  /**
   * 明确声明的注册标识，与 LayoutStyle 枚举保持一致 
   */
  static readonly LAYOUT_STYLE = LayoutStyle.RAN;


  // ==================== 公共接口 ====================
  /**
   * 计算当前模型下所有卡片元素的变换矩阵（平移 + 缩放）
   *
   * 为 118 个元素分别生成随机位置：
   * - X 坐标：在 `[-viewportW/3 , +viewportW/3]` 范围内均匀随机
   * - Y 坐标：在 `[-viewportH/3 , +viewportH/3]` 范围内均匀随机
   * - Z 坐标：在 `[-200 , 200]` 范围内均匀随机
   *
   * @returns Matrix3d[] 卡片元素的变换矩阵数组
   * 每个矩阵描述了对应卡片元素的局部变换，其中平移部分决定其位置
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

      // 通过工具函数生成变换矩阵 [缩放，平移]--> 执行顺序 先平移, 后缩放 (注意: 变换从右向左应用)
      matrices[i] = MatrixTools.transform(matrixsArgs);
    }

    return matrices;
  }

  public calcCardsWrapMatrix3d (): Matrix3d {
    return MatrixTools.identityMatrix();
  }
}