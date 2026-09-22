# Star Scoop (Game01 v0.1.1)

11–13 岁向太空收集小游戏：俯视开飞船 scoop 能量块，躲开小行星，通关 3 关。

## Play online (GitHub Pages)

Public play: [https://peterlei853.github.io/GorkBot-Game/](https://peterlei853.github.io/GorkBot-Game/)

Pages serves **v0.1.1** (main-loop fix) from the **main** branch root (`index.html`). After the first enable, the site can take a minute to go live.

## 怎么玩

Open the Pages URL above, or double-click **`index.html`** (no install).

或：

```bash
npm start
```

打开 http://localhost:5173

## 操作

| 输入 | 作用 |
|------|------|
| WASD / 方向键 | 移动 |
| 鼠标拖拽 / 触屏滑动 | 朝指针方向飞 |
| Esc / P 或「暂停」 | 暂停 |
| 「静音」 | 开关轻快 BGM |

## 规则（Design Spec v0.1）

- 3 条命；撞小行星 −1
- 每关限时内收够能量块过关
- 关卡：70s/8 · 65s/12 · 60s/16（同机制递进）
- 通关 3 关 You Win

## 版本

**v0.1.1** — Hotfix: 修复主循环崩溃；默认 BGM 可闻

**v0.1.0** — 首版实现 approved Design Spec v0.1（Star Scoop）
