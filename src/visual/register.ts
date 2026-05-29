import type { MoStatus, IVisualModelCtor } from '@/typings';
import VisualModelFactory from '@/visual/VisualModelFactory';

/**
 * 类装饰器：将目标类自动注册到 VisualModelFactory.registry 中
 * 
 * 注册时会优先读取目标类的静态属性 `MODEL_STATUS`，
 * 若未定义则降级使用类名（name）作为注册 key。
 * 
 * 使用方式：
 * @registerToVisualModelFactory()
 * class SomeModel extends VisualModelFactory { ... }
 * 
 * @returns ClassDecorator
 */
export default function registerToVisualModelFactory(): ClassDecorator {
  return function (target: any) {

    // 推断模型的注册 key：优先取明确声明的 MODEL_STATUS，否则使用类名
    const key: MoStatus = (target as any).MODEL_STATUS ?? target.name;

    // 将子类构造函数存入父类静态注册表中 
    VisualModelFactory.registry[key] = target as IVisualModelCtor;
  }
};