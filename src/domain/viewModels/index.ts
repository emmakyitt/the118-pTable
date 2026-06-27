/**
 * @file 视图模型注册中心
 *
 * 本模块负责：
 * 1. 导出 ViewModelFactory（视图模型工厂）和不同布局样式下卡片容器的默认 matrix3d 矩阵
 * 2. 通过副作用导入所有布局对应的 ViewModel 实现类，
 *    这些实现类利用装饰器在模块加载时自动向 ViewModelFactory 注册自身，
 *    从而让 ViewModelFactory 的注册表在外部使用前就已填充完整
 */

import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';
import MatrixTools from '@/infrastructure/utils/MatrixTools';
import { LayoutStyle } from '@/domain/typings/viewModels';
import type { Matrix3d } from '@/infrastructure/typings/matrixTools';

/**
 * 各布局样式对应的卡片容器默认 matrix3d 矩阵
 *
 * 当前支持的布局样式：
 * - GRI（网格）、TAB（表格）、RAN（随机）：等比例缩放 [1,1,1,2]
 * - SPH（球面）：缩小至 60% [0.6,0.6,1,2]
 * - HEL（螺旋）：缩小至 80% [0.8,0.8,1,2]
 *
 * 键为 LayoutStyle 枚举值，值为 MatrixTools.scale 生成的矩阵
 * 使用 `as const` 保证类型精确（字面量类型）且对象只读
 */
const cardsWrapDfltMatix3d = {
  [LayoutStyle.GRI]: MatrixTools.scale([1, 1, 1, 2]),
  [LayoutStyle.SPH]: MatrixTools.scale([.6, .6, 1, 2]),
  [LayoutStyle.TAB]: MatrixTools.scale([1, 1, 1, 2]),
  [LayoutStyle.HEL]: MatrixTools.scale([.8, .8, 1, 2]),
  [LayoutStyle.RAN]: MatrixTools.scale([1, 1, 1, 2])
} as const satisfies Record<LayoutStyle, Matrix3d>;


/**
 * 副作用导入 (注册) ：加载各布局视图模型的实现类
 *
 * 这些实现类通过装饰器（@registerTo(ViewModelFactory)）在本模块执行时
 * 向 ViewModelFactory 的注册表添加条目，从而建立 LayoutStyle 到 ViewModel 的映射
 * 导入顺序不影响注册结果，但必须在 ViewModelFactory 被使用前完成注册
 */
import '@/domain/viewModels/implementations/TabViewModel';
import '@/domain/viewModels/implementations/SphViewModel';
import '@/domain/viewModels/implementations/RanViewModel';
import '@/domain/viewModels/implementations/HelViewModel';
import '@/domain/viewModels/implementations/GriViewModel';

// 对模块外部统一暴露 （此时 ViewModelFactory registry 已填充完整）
export { ViewModelFactory, cardsWrapDfltMatix3d };