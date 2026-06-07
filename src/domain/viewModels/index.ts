import ViewModelFactory from '@/domain/viewModels/ViewModelFactory';

// 通过副作用导入完成各个子类的注册（装饰器会在模块加载时执行）
import '@/domain/viewModels/implementations/TabViewModel';
import '@/domain/viewModels/implementations/SphViewModel';
import '@/domain/viewModels/implementations/RanViewModel';
import '@/domain/viewModels/implementations/HelViewModel';
import '@/domain/viewModels/implementations/GriViewModel';

// 对模块外部统一暴露 （此时 ViewModelFactory registry 已填充完整）
export { ViewModelFactory };