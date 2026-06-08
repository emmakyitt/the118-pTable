/**
 * @file 元素数据服务模块
 * @description 提供周期表元素的统一数据访问，数据源于静态 JSON 文件。
 */
import elementsData from '@/assets/data/elements.json'

/**
 * 元素基本数据接口
 * @interface ElementBasic
 * @description 描述周期表中单个元素的核心信息
 */
export interface ElementBasic {

  /** 原子序数（元素唯一标识） */
  ElementID: number;

  /** 元素符号，如 H, He */
  Symbol: string;

  /** 元素中文/英文名称 */
  Name: string;

  /** 元素分类，如 碱金属、稀有气体 */
  Category: string;

  /** 相对原子质量 */
  Mass: number;
}

/**
 * 元素数据服务
 * @class ElementService
 * @description 静态服务类，提供对周期表元素数据的统一访问入口。
 * 所有数据在模块加载时一次性初始化，之后仅提供只读查询。
 */
export class ElementService {

  /**
   * 内部存储的全部元素数据
   */
  private static elements: ElementBasic[] = elementsData;

  /**
   * 获取所有元素
   * @returns {ElementBasic[]} 包含全部元素的数组，按原始顺序排列
   */
  static getAll(): ElementBasic[] | null{
    return this.elements ?? null;
  }

  /**
   * 按原子序数获取单个元素
   * @param {number} id - 元素的原子序数 (ElementID)
   * @returns {ElementBasic | undefined} 匹配的元素对象；若未找到则返回 undefined
   */
  static getById(id: number): ElementBasic | null {
    return this.elements.find(el => el.ElementID === id) ?? null;
  }

  /**
   * 按分类获取元素列表
   * @param {string} category - 元素分类名称，如 'nonmetal'
   * @returns {ElementBasic[]} 属于该分类的所有元素数组；若无匹配则返回空数组
   */
  static getByCategory(category: string): ElementBasic[] | null {
    return this.elements.filter(el => el.Category === category) ?? null;
  }
}