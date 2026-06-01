<h1 align="center">THE118™ ·  3D 化学元素周期表</h1>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="version">
  <img src="https://img.shields.io/badge/react-19.2-61dafb" alt="react">
  <img src="https://img.shields.io/badge/typescript-6.0-3178c6" alt="typescript">
  <img src="https://img.shields.io/badge/vite-8.0-646cff" alt="vite">
</p>

>  **纯数学驱动的浏览器端 3D 渲染方案** —— 无 Three.js，无 WebGL，仅依靠自定义矩阵运算与 CSS `matrix3d` 实现五种化学元素周期表立体布局及其流畅的动画切换。

---

## ✨ 设计理念

项目以 **“零依赖 3D 渲染”** 为目标，将所有几何体定位任务抽象为**线性代数问题**。每个视觉模型通过计算得到 118 个元素的**变换矩阵**，直接写入 DOM 元素的 `transform: matrix3d(...)` 样式，并借助 CSS `transition` 实现视图间平滑动画，无 JavaScript 动画帧开销。

- **计算层**：自定义 `MathTools`（几何公式）与 `MatrixTools`（4x4 矩阵构造、乘法、复合变换）
- **架构层**：继承抽象工厂 `VisualModelFactory`，使用装饰器自动注册，按需实例化
- **渲染层**：React 组件无业务逻辑，仅负责矩阵→DOM 的纯净映射

---

## ⚙️ 技术架构

用户交互 (BottomMenu)
▼ 
App.tsx ── setMoStatus ──▶ useEffect
│
├── new VisualModelFactory(moStatus)
│ │
│ ├── 装饰器路由 → TaModel / SpModel / HeModel / GrModel / RaModel
│ │
│ └── .getMatrix3d() → Matrix3D[]
▼ 
{ matrix3d[] } ──▶ ElementUnit[] ──▶ style={{ transform: matrix3d(...) }}

### 抽象工厂与装饰器注册
- **`VisualModelFactory`** 既是抽象基类也是工厂入口。通过 `new VisualModelFactory(status)` 时，内部根据 `registry` 动态返回对应子类实例（多态构造）。
- 每个具体视图类（如 `TaModel`）使用 `@registerToVisualModelFactory()` 装饰器自动注册，极大降低添加新布局的耦合。

### 数学矩阵运算优化
- `MatrixTools.multiply(a, b)` 将 4×4 矩阵乘法的循环完全展开，消除索引与循环开销。
- 平移/旋转/缩放矩阵均通过**直接构造**生成，不通过组合基础矩阵乘法，减少算术操作。
- 各模型首次计算后**缓存**矩阵数组，后续调用直接返回同一引用，确保动画帧开销恒定。

---

## 五种布局模型
| 模型     | 核心算法                             |
| ------ | -------------------------------- |
| **表格** | 固定网格 + 镧系锕系特殊偏移，通过模板数组控制元素显隐     |
| **球体** | 纬度非均匀分割（极点稀疏、赤道密集）、经度均匀分布、球面参数方程 |
| **螺旋** | 等距上升 + 均匀角增量绕 Y 轴旋转              |
| **网格** | 多层 5×8 面板沿 Z 轴堆叠                 |
| **随机** | 视口约束下的三维均匀随机散点分布                   |
所有变换最终由 `MatrixTools.transform([平移, 旋转, 缩放])` 一次生成矩阵，遵循 **先缩放 → 旋转 → 平移** 的组合顺序（右乘原则）。

---
## 📁 核心目录

src/
├── assets/   # 数据与图标
│ ├── elements.ts         # 118 元素基础数据
│ └── charTemplate.ts    # 表格字符模板
├── components/         # UI 组件
│ ├── PeriodicTable/  # 周期表容器
│ ├── ElementUnit/    # 单元素卡片
│ └── BottomMenu/     # 视图切换栏
├── visual/ # 视图模型（策略）
│ ├── VisualModelFactory   # 抽象工厂 + 注册表
│ ├── register.  # 类装饰器
│ ├── ta / sp / he / gr / ra   # 五种子类实现
├── utils/   # 数学库
│ ├── MathTools     # 几何计算
│ └── MatrixTools.  # 矩阵运算与组合
└── typings/   # 全局类型与枚举

---


## 🚀 快速开始

### 安装依赖
```bash
yarn
# 或
pnpm install
# 或
npm install
```
### 启动开发服务器

```bash
yarn dev
# 或
pnpm dev
# 或
npm run dev

# 浏览器访问 `http://localhost:5173`
```

## 🕰️ 当前版本 (v0.1.0)

### 0.1.0 (2026-06-01) 

- ✅ 五种 3D 布局的完整矩阵生成
- ✅ 视图切换过渡动画
- ✅ 装饰器驱动的可扩展模型架构
- ✅ 矩阵运算性能优化（展开乘法、缓存策略）
- ✅ TypeScript 严格模式 + ESLint
- ✅ 规范化 Git 提交工具链

---

## 🗺️ 路线图

- **v0.1.0** (当前) 基础 3D 布局引擎、视图切换动画、核心架构与开发规范就绪

- **v0.2.0** 场景交互：鼠标拖拽旋转/缩放，元素悬停提示，详情面板
    
- **v0.3.0** 视觉增强：元素分类着色，暗色主题，粒子特效
    
- **v1.0.0** 完整功能：元素搜索，移动端适配，i18n，数据可视化


---

## 🤝 贡献指南

1. 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 提交规范（项目已配置 commitizen 交互式提交）。

2. 新增布局模型请继承 `VisualModelFactory`，并添加 `@registerToVisualModelFactory()` 装饰器，静态属性 `MODEL_STATUS` 需与 `MoStatus` 枚举新增值匹配。

3. 请保持所有数学工具方法为纯函数，确保组件无副作用。


---

## 📄 许可证

本项目仅用于**学习与交流**，保留所有权利。未经授权，禁止商用。

© 2026 Emmaky. ALL RIGHTS RESERVED.