import VisualModelFactory from '@/visual/VisualModelFactory';

// 通过副作用导入完成各个子类的注册（装饰器会在模块加载时执行）
import '@/visual/ta/index.model';
import '@/visual/sp/index.model';
import '@/visual/he/index.model';
import '@/visual/gr/index.model';
import '@/visual/co/index.model';

// 对模块外部统一暴露 VisualModelFactory registry 已填充完整）
export { VisualModelFactory };