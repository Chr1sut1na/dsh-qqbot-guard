# dsh-qqbot-guard

QQ 机器人边界守卫（dsh 插件）：给 `@tencent-connect/dsh-qqbot` 的机器人加两层防护，并带一个可在设置页编辑的约束提示词。

> **这不是沙箱。** 本插件在"模型请求"层面移除工具 schema，属于策略层防护；识别依赖 dsh / dsh-qqbot 的内部事件（`system-prompt/assemble` 与 `qqbot:scope-prompt` section），上游改名时会**静默失效（fail-open）**。请始终同时配置 qqbot 的 `access` 白名单，不要把它当作唯一的隔离边界。

## 它能做什么

1. **工具防火墙**：识别出 QQ 机器人会话，把模型请求里的工具收窄到白名单（默认只有 `web_search`、`web_fetch`）。模型看不到的工具就无法调用，因此 `read / write / edit / grep / glob / pwsh / qqbot_send_file / subagent / workflow / schedule_*` 等本地能力全部失效。
2. **角色内回避**：给 QQ 机器人追加一段 system-prompt 规则，让它遇到"列目录 / 读文件 / 跑命令 / 查系统信息 / 你是不是 AI / 什么模型"这类请求时，用角色口吻装听不懂，而不是解释"我没有这个工具/权限"。
3. **设置页**：`设置 → QQ 机器人边界守卫`，可编辑约束提示词、开关规则、编辑工具白名单、查看运行状态。保存后下一轮请求即生效。

## 安装

### 方式一：插件管理器（推荐，会出现在「插件」页的已安装列表）

桌面客户端的 **插件 → 添加插件（箭头）→ 安装第三方插件**，填 tarball 路径、包目录或 Git 地址；
命令行 profile 用：

```powershell
dsh plugin --profile <profile名> add ./dsh-qqbot-guard-0.1.2.tgz
# 或目录形式
dsh plugin --profile <profile名> add ./dsh-qqbot-guard
# 或直接从 GitHub 装（推荐用 github: 形式，网页地址不是合法的包 spec）
dsh plugin --profile <profile名> add github:Chr1sut1na/dsh-qqbot-guard
```

### 让 AI 助手帮你装

可以直接对你的 dsh 说：

> 请帮我安装 dsh 插件 `github:Chr1sut1na/dsh-qqbot-guard`（仓库：https://github.com/Chr1sut1na/dsh-qqbot-guard）。
> 如果我的 profile 是桌面客户端独占的，请告诉我「插件 → 添加插件 → 安装第三方插件」里该填什么；装完帮我在设置里确认面板出现。

注意：`https://github.com/...` 这种网页地址不是合法的包 spec，安装时要用 `github:用户/仓库` 或 `git+https://github.com/用户/仓库.git`。

> Electron 桌面版独占的 profile（如默认 `desktop`）会拒绝 CLI 操作，用客户端里的「安装第三方插件」。

安装器会把这个包写进 profile 的 `dependencies` 和 `dsh.profile.bundles`，所以装完会作为**组合包**出现在「插件」页：能启停、能卸载、能看到它插入的 `qqbot-guard` 行。

### 方式二：手动安装（只用于调试，**不会**出现在「插件」页）

1. 把包目录复制到 `<profile>\node_modules\dsh-qqbot-guard\`；
2. 在 `<profile>\cordis.patch.yml` 里加：

```yaml
- insert:
    - id: qqbot-guard
      name: 'dsh-qqbot-guard'
```

手工方式只是一条 Loader 行：功能能用，但「插件」页（组合包管理）看不到它，只能在「设置 → 内置插件」的只读清单里找到；也不能在那里启停/卸载。

> 别两种方式同时用：会成为两个同 id 的条目，造成重复加载。

### 安装后怎么确认

- 「插件」页出现 `dsh-qqbot-guard` 卡片，详情里能看到它声明的 `qqbot-guard` 行；
- 「设置」里出现「QQ 机器人边界守卫」面板；
- `<profile>\package.json` 的 `dependencies` 与 `dsh.profile.bundles` 都包含它；
- 卡片若显示错误，先查 `cordis.patch.yml` 是否随包发出（`dsh.bundle.patch` 指向它），再查行 id 是否与 profile 里已有行冲突。

## 可选补丁：注意力闸

如果希望机器人在群里**不要每条都接话**——只在被 @、被叫名字（祖母绿 / 首席）、或话题命中兴趣词时才开口，其余消息静默——可以额外应用 `patches/attention-gate/` 里的补丁。

它是**对已安装 qqbot 的补丁**（不是独立插件，因为 qqbot 的中间件链没有对外钩子），每次升级 qqbot 后需要重跑一次：

```powershell
powershell -ExecutionPolicy Bypass -File .\patches\attention-gate\apply.ps1
```

详见 [patches/attention-gate/README.md](patches/attention-gate/README.md)。

## 配置

高级项在 `cordis.patch.yml` 的 `qqbot-guard` 行里覆盖（整行替换）：

```yaml
- id: qqbot-guard
  name: 'dsh-qqbot-guard'
  config:
    tools:
      mode: allow          # allow | deny
      allow: [web_search, web_fetch]
      deny: []
    detect:
      sections: [qqbot:scope-prompt]   # 主判据
      cwdPrefixes: []                  # 兜底：机器人工作目录前缀，如 'C:/Users/<你>/.dsh-qqbot/'
      toolNames: []                    # 兜底：QQ 专属工具名
    persona:
      enabled: true
      name: qqbot:no-machine
      order: 95
      text: ''             # 留空=内置规则；设置页改的优先于这里
```

### 配置优先级（规则文本 / 工具白名单）

设置页（`~/.dsh-qqbot-guard/config.json`） > 上述 YAML > 内置默认。

## 验证

- 设置页「QQ 机器人边界守卫」→ 状态区显示命中次数 / 移除工具数 / 最近命中依据。
- 或 `GET /qqbot-guard/config` 直接看 JSON。

## 卸载

- CLI 安装的：`dsh plugin --profile <名> remove dsh-qqbot-guard`。
- 手动安装的：删掉 `cordis.patch.yml` 里的 `insert` 行，再删 `node_modules\dsh-qqbot-guard` 目录（可选删 `~/.dsh-qqbot-guard/config.json`）。

## 已知限制

- **fail-open**：若 dsh / dsh-qqbot 上游改名（例如 section 名不再叫 `qqbot:scope-prompt`），识别会失效、工具原样放行且不报错。升级后请先看一眼状态计数；必要时用 `detect.cwdPrefixes` 兜底。
- **策略层而非系统沙箱**：本插件只是把工具从模型请求里删掉，不是内核隔离；请保留 qqbot 的 `access` 白名单。
- **prompt 层规则可被极端越狱绕过**：约束提示词不是硬边界。

## License

MIT
