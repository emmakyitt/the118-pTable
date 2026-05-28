/**
 * 数学工具类，提供几何计算相关的静态方法。
 * 该类仅包含静态方法，禁止实例化。
 */
export default class MathTools {

  /** 弧度与角度的转换常量 */
  private static readonly RAD_PER_DEG = Math.PI / 180;

  /** 圆周率的两倍 */
  private static readonly TWO_PI = 2 * Math.PI;

  /**
   * 私有构造器，防止外部实例化。
   * @throws {Error} 如果尝试实例化该类
   */
  private constructor() {
    throw new Error('MathTools 是工具类，不能被实例化');
  }

  /**
   * 根据圆的周长计算半径。
   * @param circumference - 圆的周长（必须为非负数）
   * @returns 圆的半径
   * @throws {RangeError} 如果周长为负数
   * @example
   * MathTools.radiusFromCircumference(10); // ≈1.5915
   */
  static radiusFromCircumference(circumference: number): number {
    if (circumference < 0) {
      throw new RangeError('圆的周长不能为负数');
    }
    return circumference / MathTools.TWO_PI;
  }

  /**
   * 计算圆上给定圆心角所对应的弦长。
   * @param radius - 圆的半径（必须为正数）
   * @param angleDeg - 圆心角（角度制，0°～360°）
   * @returns 弦的长度
   * @throws {RangeError} 如果半径小于等于0
   * @example
   * MathTools.chordLength(5, 60); // ≈5
   */
  static chordLength(radius: number, angleDeg: number): number {
    if (radius <= 0) {
      throw new RangeError('半径必须为正数');
    }
    if (angleDeg < 0 || angleDeg > 360) {
      throw new RangeError('圆心角必须在 0° 到 360° 之间');
    }
    const halfAngleRad = MathTools.angleToRad(angleDeg) / 2;
    return 2 * radius * Math.sin(halfAngleRad);
  }
  
  /**
   * 将角度转换为弧度。
   * @param degrees - 角度值
   * @returns 对应的弧度值
   * @example
   * MathTools.angleToRad(180); // ≈3.14159
   */
  static angleToRad(degrees: number): number {
    return degrees * MathTools.RAD_PER_DEG;
  }

   /**
   * 通过余弦定理计算三角形第三边的长度。
   * 已知两边长度及其夹角（角度制），返回该夹角对边的长度。
   *
   * @remarks
   * 公式：c² = a² + b² - 2ab·cos(C)
   *
   * @param sideA - 三角形的一条边长度（必须为正数）
   * @param sideB - 三角形的另一条边长度（必须为正数）
   * @param angleDeg - 两边夹角的角度值（角度制，0°～180°）
   * @returns 第三边的长度
   * @throws {RangeError} 如果边长小于等于0，或角度超出 0°～180° 范围
   * @example
   * MathTools.thirdSideByCosineLaw(3, 4, 90); // 5
   */
  static thirdSideByCosineLaw(
    sideA: number,
    sideB: number,
    angleDeg: number
  ): number {
    
    if (sideA <= 0 || sideB <= 0) {
      throw new RangeError('三角形的边长必须为正数');
    }
    if (angleDeg < 0 || angleDeg > 180) {
      throw new RangeError('夹角必须在 0° 到 180° 之间');
    }

    // 将角度转换为弧度，供 Math.cos 使用
    const angleRad = MathTools.angleToRad(angleDeg);
    
    // 余弦定理：c² = a² + b² - 2ab·cos(C)，开平方即得第三边
    return Math.sqrt(
      sideA * sideA + sideB * sideB - 2 * sideA * sideB * Math.cos(angleRad)
    );
  }
}
