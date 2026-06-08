import type { LayoutStyle, IViewModelCtor } from '@/domain/models/typings';

/**
 * 类装饰器：将目标类自动注册到 ViewModelFactory.registry 中
 * 注册时会读取目标类的静态属性 `LAYOUT_STYLE`，
 * 
 * 使用方式：
 * @registerTo(ViewModelFactory)
 * class SomeViewModel extends ViewModelFactory { ... }
 * 
 * @returns ClassDecorator
 */
export default function registerTo(
  baseClass: { registry: Record<string, IViewModelCtor> }
): ClassDecorator {
  return function (target: any) {

    // 通过子类中LAYOUT_STYLE 来推断模型类的注册
    const key: LayoutStyle = target!.LAYOUT_STYLE;

    // 将子类构造函数存入父类静态注册表中 
    baseClass.registry[key] = target as IViewModelCtor;
  }
};