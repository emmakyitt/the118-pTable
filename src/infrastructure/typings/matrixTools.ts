/**
 * 单位矩阵 
 */
export type Matrix = [number, number, number, number];

/**
 * 4x4 矩阵（以行主序表示）
 * 每个元素为长度为 4 的数组，整体是 4 个长度为 4 的数组组成的元组
 */
export type Matrix3d = [Matrix, Matrix, Matrix, Matrix];