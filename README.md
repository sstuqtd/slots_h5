# slots_h5

一个面向 H5 的 Unity 风格引擎项目骨架，按你要求拆分为两个主目录：

- `engine/`：引擎目录（Unity 风格 API 兼容层 + 生命周期 + 输入 + 基础渲染）。
- `game/`：游戏目录（示例游戏逻辑，直接基于引擎 API 开发）。

## 目录结构

```text
.
├─ engine/
│  ├─ src/index.ts        # Unity 风格核心 API
│  ├─ package.json
│  └─ tsconfig.json
├─ game/
│  ├─ src/main.ts         # 示例游戏
│  ├─ index.html
│  ├─ package.json
│  └─ tsconfig.json
├─ package.json
└─ tsconfig.base.json
```

## 快速开始

```bash
npm install
npm run build
python3 -m http.server 8080
```

然后打开：

- `http://localhost:8080/game/`

## 在线访问（GitHub Pages）

已添加自动发布工作流：`.github/workflows/deploy-pages.yml`  
部署成功后可访问：

- `https://sstuqtd.github.io/slots_h5/`
- 游戏直达：`https://sstuqtd.github.io/slots_h5/game/`

## 当前已提供的 Unity 风格 API（核心子集）

- 对象与组件
  - `Object`
  - `Component`
  - `Behaviour`
  - `MonoBehaviour`
  - `GameObject`
  - `Transform`
- 数学与工具
  - `Vector2`
  - `Vector3`
  - `Color`
  - `Mathf`
  - `Debug`
  - `Time`
  - `Input`
- 渲染与运行时
  - `Renderer`
  - `SpriteRenderer`
  - `Scene`
  - `Engine`

生命周期支持：

- `Awake`
- `OnEnable`
- `Start`
- `Update`
- `OnDisable`

## 说明

Unity 官方 API 规模很大（包含大量模块：物理、动画、UI、资源系统、Job/Burst、NavMesh 等），本项目当前先提供了可运行的核心兼容层，并保持 API 命名风格与使用习惯尽量贴近 Unity，后续可按同样方式逐步扩展到更多模块。