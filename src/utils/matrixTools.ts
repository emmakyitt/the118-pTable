import type { Matrix, Matrix3D } from '@/typings';

export default (function () {

  // ---------- 抽象工具类 ----------
  abstract class MtxTools {
  /**
   * 该类提供静态方法用于生成4x4变换矩阵（平移、旋转、缩放、复合）
   */

    // ---------- 单位矩阵 ----------
    private static matrix = (): Matrix3D => [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]

    // 运算工具
    private static readonly sin = Math.sin;
    private static readonly cos = Math.cos;
    private static readonly deg = (v: number): number => (Math.PI / 180) * v;

    // 角度运算 
    private static sinCos(v: number): number[] {
      return [
        MtxTools.cos(MtxTools.deg(v)),
        MtxTools.sin(MtxTools.deg(v))
      ]
    }

    // ---------- 组合变换 ----------
    /**
     * 根据变换配置数组生成最终变换矩阵
     * 每个元素为 [p1, p2, p3, type]
     * type: 0 = 平移, 1 = 旋转, 2 = 缩放
     */
    static transform(transforms: Matrix[]): Matrix3D {
      const handlers = [MtxTools.offset, MtxTools.rotate, MtxTools.scale];
      const matrices: Matrix3D[] = transforms.map((t) => handlers[t[3]](t));
      return matrices.reduce((a:Matrix3D, b:Matrix3D) => MtxTools.multiply(a, b));
    }

    // ---------- 矩阵乘法 ----------
    /**
     * 4x4 矩阵乘法 C = A * B
     */
    static multiply(a: Matrix3D, b: Matrix3D): Matrix3D {
      const result: Matrix3D  = [
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0],
        [0,0,0,0]
      ]

      for (let i = 0; i < 4 * 16; i++) {
        const r = Math.floor(i/16);
        const j = Math.floor(i%16/4);
        const k = i%4;
        result[r][j] += a[r][k] * b[k][j];
      }
      return result;
    }

    // ---------- 复合平移 ----------
    /**
     * 根据向量 [tx, ty, tz] 生成复合平移矩阵
     */
    static offset(v: number[]): Matrix3D {
      return [
        MtxTools.offsetX(v[0]),
        MtxTools.offsetY(v[1]),
        MtxTools.offsetZ(v[2]),
      ].reduce((a:Matrix3D, b:Matrix3D) => MtxTools.multiply(a, b));
    }

    // ---------- 复合旋转 ----------
    /**
     * 根据向量 [rx, ry, rz] (角度) 生成复合旋转矩阵
     * 按 X -> Y -> Z 顺序
     */
    static rotate(v: number[]): Matrix3D {
      return [
        MtxTools.rotateX(v[0]),
        MtxTools.rotateY(v[1]),
        MtxTools.rotateZ(v[2]),
      ].reduce((a:Matrix3D, b:Matrix3D) => MtxTools.multiply(a, b));
    }

    // ---------- 平移 ----------
    static offsetX(v: number): Matrix3D {
      const matrix = MtxTools.matrix();
      matrix[3][0] = v;
      return matrix;
    }

    static offsetY(v: number): Matrix3D {
      const matrix = MtxTools.matrix();
      matrix[3][1] = v;
      return matrix;
    }

    static offsetZ(v: number): Matrix3D {
      const matrix = MtxTools.matrix();
      matrix[3][2] = v;
      return matrix;
    }

    // ---------- 旋转 ----------
    static rotateX(v: number): Matrix3D {
      const matrix = MtxTools.matrix();
      const [c, s] = MtxTools.sinCos(v);
      matrix[1][1] = c;
      matrix[1][2] = -s;
      matrix[2][1] = s;
      matrix[2][2] = c;
      return matrix;
    }

    static rotateY(v: number): Matrix3D {
      const matrix = MtxTools.matrix();
      const [c, s] = MtxTools.sinCos(v);
      matrix[0][0] = c;
      matrix[0][2] = -s;
      matrix[2][0] = s;
      matrix[2][2] = c;
      return matrix;
    }

    static rotateZ(v: number): Matrix3D {
      const matrix = MtxTools.matrix();
      const [c, s] = MtxTools.sinCos(v);
      matrix[0][0] = c;
      matrix[0][1] = -s;
      matrix[1][0] = s;
      matrix[1][1] = c;
      return matrix;
    }

    // ---------- 缩放 ----------
    /**
     * 根据向量 [sx, sy, sz] 生成缩放矩阵
     */
    static scale(s: number[]): Matrix3D {
      const matrix = MtxTools.matrix();
      const [sx, sy, sz] = s;
      matrix[0][0] = sx;
      matrix[1][1] = sy;
      matrix[2][2] = sz;
      return matrix;
    }

  }

  return MtxTools;
})();