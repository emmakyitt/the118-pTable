import MathTools from '@/infrastructure/utils/MathTools';
import type { Matrix, Matrix3d } from '@/infrastructure/typings/matrixTools';

/**
 * 矩阵工具类（纯静态方法，禁止实例化）。
 * 提供 3D 变换矩阵的构造、乘法以及组合变换等功能。
 * 所有矩阵均采用 4x4 二维数组表示，行主序，适用于列向量右乘, 变换从右向左应用。
 * 
 * 基础矩阵构建参考 MDN WebGL 矩阵数学文档
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
 */
export default class MatrixTools {

  /** 单位矩阵 */
  static identityMatrix (): Matrix3d {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  /**
   * 私有构造器，防止外部实例化。
   * @throws {Error} 如果尝试实例化该类
   */
  private constructor() {
    throw new Error('MatrixTools 是工具类，不能被实例化');
  }

  /**
   * 根据角度（度）同时计算余弦和正弦值。
   * 
   * @param d 角度值（度）
   * @returns [cos, sin] 元组
   */
  private static sinCos(d: number): number[] {
    const rad: number  = MathTools.angleToRad(d); // 弧度转换
    return [ Math.cos(rad), Math.sin(rad)];
  }

  /**
   * 变换处理器映射表（索引对应 type：0 = 平移, 1 = 旋转, 2 = 缩放）
   * 提升为静态常量，避免每次 transform 调用时重复创建数组。
   */
  private static readonly MATRIX_HANDLERS = [
    MatrixTools.offset,
    MatrixTools.rotate,
    MatrixTools.scale,
  ] as const;

  // ---------- 组合变换 ----------
  /**
   * 根据变换配置数组生成最终变换矩阵（高频率调用）
   * 每个配置为 [p1, p2, p3, type]：
   * - type = 0 ：平移，[tx, ty, tz, 0]
   * - type = 1 ：旋转，[rx, ry, rz, 1]（角度，度）
   * - type = 2 ：缩放，[sx, sy, sz, 2]
   * 
   * 
   * 建议顺序：缩放 -> 旋转 -> 平移, 变换从右向左应用
   *
   * 优化点：减少非必要的LHS赋值操作, 直接返回最终运算结果
   *
   * @param transforms 变换配置数组
   * @returns 组合后的 4x4 变换矩阵
   */
  static transform(transforms: Matrix[]): Matrix3d {
    try {
      return transforms.map((t) => MatrixTools.MATRIX_HANDLERS[t[3]](t)).reduce(
        (a:Matrix3d, b:Matrix3d) => MatrixTools.multiply(a, b)
      );
    } catch (e: any) {
      console.error('MatrixTools.transform requires an array of the type matrix[][]', e);
      return MatrixTools.identityMatrix();
    }
  }

  // ---------- 矩阵乘法（展开循环，消除索引计算与循环开销） ----------
  /**
   * 4x4 矩阵乘法 C = A * B
   * 优化点：完全展开循环，读取全部元素到局部变量后批量计算，大幅减少循环与索引开销
   * 
   * 
   * 算法原理：
   * 对于矩阵 A（4×4）与 B（4×4），乘积矩阵 C 的元素定义为：
   * 
   * 计算公式: -> C[i][j] = Σ_{k=0}^{3} A[i][k] * B[k][j]
   * 
   * C的第 i 行第 j 列，等于 A 的第 i 行 与 B 的第 j 列 的点积
   *
   * @param a 左矩阵（4x4
   * @param b 右矩阵（4x4）
   * @returns 乘积矩阵
   */
  static multiply(a: Matrix3d, b: Matrix3d): Matrix3d {

    // 提取 A 的全部元素
    const a00 = a[0][0], a01 = a[0][1], a02 = a[0][2], a03 = a[0][3];
    const a10 = a[1][0], a11 = a[1][1], a12 = a[1][2], a13 = a[1][3];
    const a20 = a[2][0], a21 = a[2][1], a22 = a[2][2], a23 = a[2][3];
    const a30 = a[3][0], a31 = a[3][1], a32 = a[3][2], a33 = a[3][3];

    // 提取 B 的全部元素
    const b00 = b[0][0], b01 = b[0][1], b02 = b[0][2], b03 = b[0][3];
    const b10 = b[1][0], b11 = b[1][1], b12 = b[1][2], b13 = b[1][3];
    const b20 = b[2][0], b21 = b[2][1], b22 = b[2][2], b23 = b[2][3];
    const b30 = b[3][0], b31 = b[3][1], b32 = b[3][2], b33 = b[3][3];

    // 展开乘法并返回结果矩阵
    return [
      [
        a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
        a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
        a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
        a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
      ],
      [
        a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
        a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
        a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
        a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
      ],
      [
        a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
        a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
        a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
        a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
      ],
      [
        a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
        a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
        a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
        a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33,
      ],
    ];
  }

  // ---------- 复合平移（直接构造，免去三次矩阵乘法） ----------
  /**
   * 根据向量 [tx, ty, tz] 生成复合平移矩阵
   * ```
   * | 1  0  0  0 |
   * | 0  1  0  0 |
   * | 0  0  1  0 |
   * | tx ty tz 1 |
   * ```
   * 
   * 优化点：不再调用 offsetX/Y/Z 相乘，而是直接写入平移向量
   *
   * @param n 变换配置 `[tx, ty, tz, 0]`
   * @returns 复合平移矩阵
   */
  static offset(n: Matrix): Matrix3d {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [n[0], n[1], n[2], 1],
    ];
  }

  // ---------- 复合旋转 ----------
  /**
   * 根据向量 [rx, ry, rz] (角度) 生成复合旋转矩阵
   * 按 X -> Y -> Z 顺序
   *
   * 优化点：直接使用函数链式回调返回最终运算结果, 避免reduce性能消耗
   *
   * @param m 变换配置 `[rx, ry, rz, 1]`
   * @returns 复合旋转矩阵
   */
  static rotate(m: Matrix): Matrix3d {
    return MatrixTools.multiply(
      MatrixTools.multiply(
        MatrixTools.rotateX(m[0]), 
        MatrixTools.rotateY(m[1])
      ), 
      MatrixTools.rotateZ(m[2])
    );
  }

  // ---------- 复合缩放（直接构造） ----------
  /**
   * 根据向量 [sx, sy, sz] 生成缩放矩阵
   *
   * @param m 变换配置 `[sx, sy, sz, 2]`
   * @returns 复合缩放矩阵
   */
  static scale(m: Matrix): Matrix3d {
    const [sx, sy, sz] = m;
    return [
      [sx, 0, 0, 0],
      [0, sy, 0, 0],
      [0, 0, sz, 0],
      [0, 0, 0, 1],
    ];
  }

  // ---------- 基础平移（直接构造） ----------
   /** 沿 X 轴平移 n 
    * 
    * 优化点：直接返回包含平移系数的矩阵，无需先创建单位矩阵再修改
    * */ 
  static offsetX(n: number): Matrix3d {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [n, 0, 0, 1],
    ];
  }

  /** 沿 Y 轴平移 n */
  static offsetY(n: number): Matrix3d {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, n, 0, 1],
    ];
  }

  /** 沿 Z 轴平移 n */
  static offsetZ(n: number): Matrix3d {
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, n, 1],
    ];
  }

  // ---------- 基础旋转（直接构造） ----------
  /**
   * 绕 X 轴旋转 n 度。
   * 旋转矩阵公式（右手系）：
   *   | 1   0    0   0 |
   *   | 0  cos -sin  0 |
   *   | 0  sin  cos  0 |
   *   | 0   0    0   1 |
   * 
   */
  static rotateX(n: number): Matrix3d {
    const [c, s] = MatrixTools.sinCos(n);
    return [
      [1, 0, 0, 0],
      [0, c, -s, 0],
      [0, s, c, 0],
      [0, 0, 0, 1],
    ];
  }

  /**
   * 绕 Y 轴旋转 n 度。
   * 旋转矩阵公式（右手系）：
   *   |  cos  0  sin  0 |
   *   |   0   1   0   0 |
   *   | -sin  0  cos  0 |
   *   |   0   0   0   1 |
   * 
   * 注意：当前实现中 sin 项的符号与公式定义相反，
   * 这是为了与原有渲染管线保持一致
   */
  static rotateY(n: number): Matrix3d {
    const [c, s] = MatrixTools.sinCos(n);
    return [
      [c, 0, -s, 0],
      [0, 1, 0, 0],
      [s, 0, c, 0],
      [0, 0, 0, 1],
    ];
  }

   /**
   * 绕 Z 轴旋转 n 度。
   * 旋转矩阵公式（右手系）：
   *   | cos -sin  0  0 |
   *   | sin  cos  0  0 |
   *   |  0    0   1  0 |
   *   |  0    0   0  1 |
   * 
   */
  static rotateZ(n: number): Matrix3d {
    const [c, s] = MatrixTools.sinCos(n);
    return [
      [c,-s, 0, 0],
      [s, c, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }
}