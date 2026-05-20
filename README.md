# SAM

> 全是vibe出来的，还不是很懂前端
> 主要是为了用来做算法分享辅助用
> 感觉应该有轮子，又重复造轮子了
> 但是ai时代这种事情好像也见怪不怪了
> 确实是方便
> 主要是两部分，draw是一个绘制有向边权图 + SAM 自动机的可视化引擎
> scripts/benchmark 是测 SAM 时间复杂度的 C++/Python 数据
> scripts/draw 是 CLI 风格的 SAM 一键绘制脚本 (python sam_draw.py "abcbc")

# DS V4 Pro

## draw/ -- 有向图可视化引擎 + SAM 自动机绘制

### 技术栈

React 18 + Vite 5 + Cytoscape.js 3.x + dagre 布局

### 启动

```bash
cd draw
npm install
npm run dev
# -> http://localhost:3000
```

### 功能

| 模块       | 功能                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| 通用有向图 | 表单/JSON(含文件选择) 添加节点(含分组颜色)和有向边(含权重)，拖拽节点，6 种布局 |
| SAM 构建   | 输入 a-z 字符串，纯前端 JS 构建 SAM 并渲染 DAG                          |
| SAM 扩展   | 构建后左侧隐藏手动输入区，绿色扩展栏输入追加字符，增量 extend，保留已有节点位置 |
| 新节点闪烁 | extend 或重新构建时，新增节点金色边框闪烁 1.5s 以示区分                  |
| 三视图切换 | 转移边(黑色实线) / 后缀链接(红色虚线) / 合并                            |
| 最长字符串 | 切换节点标签：显示 `len` 或对应最长子串                                |
| JSON 导入  | 自动识别 SAM 格式 (`transEdges+linkEdges`) 或通用格式 (`edges`)，支持文件上传 |
| 信息面板   | 状态节点表含等价类子串 + endpos 位置集合，转移边表，后缀链接表          |
| 深色模式   | 工具栏 `[深色]`/`[浅色]` 切换，Cytoscape 边线颜色自适应，localStorage 持久化 |
| 导出       | PNG 截图（自动适配当前主题背景色）/ JSON 数据                           |
| 编辑       | 双击画布节点/边弹出编辑面板，修改标签/分组/权重/删除，拖拽不受干扰      |

### 目录结构

```
draw/
├── index.html
├── package.json / vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx / App.css
│   ├── utils/
│   │   ├── sam.js              # JS SAM 实现 (build + toGraphData)
│   │   └── export.js           # PNG / JSON 导出
│   ├── hooks/
│   │   └── useGraphData.js     # 图数据状态管理
│   └── components/
│       ├── InputPanel.jsx       # 节点/边表单 + SAM 构建/扩展 + JSON 导入+文件上传
│       ├── GraphCanvas.jsx      # Cytoscape 渲染 + 拖拽 + 双击编辑 + 新节点闪烁
│       ├── Toolbar.jsx          # 布局/导出/清空按钮 + 视图切换 + 标签格式切换
│       ├── ViewToggle.jsx       # 转移边/后缀链接/合并 三视图按钮
│       └── SamInfoPanel.jsx     # 状态/转移边/后缀链接 三张数据表
```

```

### SAM 节点颜色 & 等价类信息

状态节点表新增两列：

| 列名 | 示例 | 说明 |
|------|------|------|
| 子串 | `"ab","b"` | 该状态下等价类的所有子串 |
| endpos | `{2,4}` | 子串在原字符串中的所有结束位置 (1-based) |

| 分组 | 颜色         | 说明                             |
| ---- | ------------ | -------------------------------- |
| 初始 | 绿 `#2ECC71` | id=0 的起始状态                  |
| 终止 | 红 `#E74C3C` | 从 last 沿 link 走到根的所有状态 |
| 克隆 | 橙 `#F39C12` | extend 过程中 clone 出的状态     |
| 默认 | 蓝 `#4B9CD3` | 其余普通状态                     |

### 三视图 & 交互

工具栏在 SAM 模式下显示：

```
视图 [转移边] [后缀链接] [合并] | 标签 [len/字符串] | 布局 [...] | 导出 [...] | 清空
```

- **转移边**: 黑色实线有向边, 标签为字符 (a/b/c...)
- **后缀链接**: 红色虚线箭头, 方向 子->父, 标签 "link"
- **合并**: 两种边同时显示
- **标签切换**: `[len]` / `[字符串]` 切换节点显示 `0 (len=0)` / `0 ("")`
- **编辑**: 双击节点/边弹出编辑面板，拖拽不冲突
- **SAM 扩展**: 输入字符串构建后，左侧手动区隐藏，顶部绿色栏显示当前字符串，追加字符点 [扩展]

---


## scripts/draw/ -- CLI 一键启动

```bash
python scripts/draw/sam_draw.py "ababc"
```

流程：

1. Python 构建 SAM，写 JSON 到 `draw/public/sam_data.json`
2. 检测端口 3000-3009 是否已有 Vite 在跑，有则复用，无则自动启动
3. 打开浏览器 `http://localhost:{port}?sam`，Web 端自动 fetch JSON 并渲染

也可单独导出 JSON：

```bash
python scripts/draw/sam_to_json.py "ababc" -o data.json
```
