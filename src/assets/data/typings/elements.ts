/**
 * 元素基本数据接口
 * @interface IElementBasic
 * @description 描述周期表中单个元素的核心信息
 */
export interface IElementBasic {

  /** 原子序数（元素唯一标识） */
  ElementID: number;

  /** 元素符号，如 H, He */
  Symbol: string;

  /** 元素中文/英文名称 */
  Name: string;

  /** 元素分类，如 "碱金属 金属"（可能包含多个分类，以空格分隔） */
  Category: string;

  /** 相对原子质量 */
  Mass: number;
}