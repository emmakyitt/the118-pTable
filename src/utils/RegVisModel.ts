import type { VisualModel, VisualModelConstructor } from '@/visual/VisualModel';

/**
 * 注册子模型到 VisualModel.registry
 * @param baseClass 基类（此处应为 VisualModel）
 * @returns 类装饰器
 */
export function RegVisModel(
  baseClass: typeof VisualModel & { registry: Record<string, VisualModelConstructor> }
): ClassDecorator {
  return function (target: any) {
    const name = target.prototype.constructor.name; // 类名
    const moStatusKey = (target as any).MODEL_STATUS ?? name;
    baseClass.registry[moStatusKey] = target;
  }
};