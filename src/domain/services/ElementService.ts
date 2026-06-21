/**
 * @file 元素数据服务模块
 * @description 提供周期表元素的统一数据访问，数据源于静态 JSON 文件。
 */
import elementsData from '@/assets/data/elements.json'
import type { IElementBasic } from '@/assets/data/typings/elements';

/**
 * 元素数据服务
 * @class ElementService
 * @description 静态服务类，提供对周期表元素数据的统一访问入口。
 * 所有数据在模块加载时一次性初始化，之后仅提供只读查询。
 */
export class ElementService {

  /**
   * 内部存储的全部元素数据，从静态 JSON 文件直接导入
   */
  private static readonly elements: IElementBasic[] = elementsData;

  /**
   * 获取所有元素
   * @returns {IElementBasic[]} 包含全部元素的数组；
   */
  static getAll(): IElementBasic[] {
    return this.elements;
  }

  /**
   * 按原子序数获取单个元素
   * @param {number} id - 元素的原子序数 (ElementID)
   * @returns {IElementBasic} 匹配的元素对象；
   */
  static getById(id: number): IElementBasic {
    return this.elements.find(el => el.ElementID === id)!;
  }

  /**
   * 根据原子序数获取元素的分类列表
   * @param {number} id - 元素的原子序数
   * @returns {string[]} 该元素的所有分类（按空格拆分后的数组）
   */
  static getCategoryById(id: number): string[] {
    return this.getById(id).Category.split(' ');
  }

  /**
   * 按分类获取元素列表（精确匹配 Category 字段）
   * @param {string} category - 元素分类名称，如 'nonmetal'
   * @returns {IElementBasic[]} 属于该分类的所有元素数组；
   */
  static getByCategory(category: string): IElementBasic[] {
    return this.elements.filter(el => el.Category === category);
  }
}