import VisualModelFactory from '@/visual/VisualModelFactory';
import registerToVisualModelFactory from '@/visual/register';
import type { Matrix, Matrix3D } from '@/typings';
import { MoStatus } from '@/typings';
import MatrixTools from '@/utils/MatrixTools';

/**
 * 布局模型（RaModel）：生成化学元素周期表（随机形态）的点阵布局。
 *
 * 该类生成的 3D 点阵中，每个元素的位置在 X、Y、Z 轴上均独立随机分布，
 * 不遵循任何周期性或对称规律，适用于“随机云雾”或“散点”形态的可视化场景。
 *  
 * 通过装饰器 @registerToVisualModelFactory 自动注册到 VisualModelFactory.registry，
 * 注册标识与 MoStatus.Ra 枚举值一致
 */
@registerToVisualModelFactory()
export default class RaModel extends VisualModelFactory {

  /** 明确声明的注册标识，与 MoStatus 枚举保持一致 */
  static readonly MODEL_STATUS = MoStatus.Ra;

  /** 元素总个数（化学元素周期表全部已知元素） */
  private static readonly ELEMENT_COUNT: number = 118;


  // ==================== 静态计算方法 ====================

  /**
   * 生成一个 [min, max] 区间内的随机整数（包含两端）。
   *
   * @param min - 最小值（整数）
   * @param max - 最大值（整数）
   * @returns 随机整数
   */
  private static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 获取当前视口（浏览器窗口）的宽度和高度。
   * 兼容 clientWidth / innerWidth 的差异，优先使用 `window.innerWidth`。
   *
   * @returns 包含宽高的对象 `{ w: number, h: number }`
   */
  private static getViewportSize(): { w: number, h: number} {
    return { 
      w: window.innerWidth || 
         document.documentElement.clientWidth || 
         document.body.clientWidth,
      h: window.innerHeight || 
         document.documentElement.clientHeight || 
         document.body.clientHeight
   };
  }


  // ==================== 公共接口 ====================

  /**
   * 生成所有元素的 3D 变换矩阵数组。
   *
   * 为 118 个元素分别生成随机位置：
   * - X 坐标：在 `[-viewportW/3 , +viewportW/3]` 范围内均匀随机
   * - Y 坐标：在 `[-viewportH/3 , +viewportH/3]` 范围内均匀随机
   * - Z 坐标：在 `[-200 , 200]` 范围内均匀随机
   *
   * @returns 变换矩阵数组，每个矩阵对应一个可视元素
   */
  getMatrix3d(): Matrix3D[] {

    // 预分配数组长度，避免在循环中使用 push 导致多次扩容
    const matrices: Matrix3D[] = new Array<Matrix3D>(RaModel.ELEMENT_COUNT);

    // 浏览器窗口宽 / 高度
    const viewportW: number = RaModel.getViewportSize().w;
    const viewportH: number = RaModel.getViewportSize().h;

    // 获取随机整数方法
    const randomInt: Function = RaModel.randomInt;

    // 平移矩阵
    const offsetMatrix: Matrix = [0, 0, 0, 0];
    const scalesMatrix: Matrix = [.5, .5, 1, 2];

    // 矩阵变换参数 [缩放，平移]
    const matrixsArgs: Matrix[] = [scalesMatrix, offsetMatrix];

    // 元素总个数
    const elementCount: number = RaModel.ELEMENT_COUNT;

    // 为每个元素生成独立随机的三维坐标，并转换为 Matrix3D 存储
    for (let i:number = 0; i < elementCount; i++) {

        // 随机坐标范围：X、Y 以视口尺寸的 1/3 为限，Z 在 [-200, 200] 之间
        offsetMatrix[0] = randomInt(-viewportW / 3, viewportW / 3);
        offsetMatrix[1] = randomInt(-viewportH / 3, viewportH / 3);
        offsetMatrix[2] = randomInt(-200, 200);

      matrices[i] = MatrixTools.transform(matrixsArgs);
    }

    return matrices;
  }
}