# 注意力闸（可选补丁）

> 这不是独立插件，而是对已安装的 `@tencent-connect/dsh-qqbot` 打的一个小补丁。
> **每次升级 qqbot 后都要重跑一次**（升级会替换 `node_modules` 里的文件）。

## 它解决什么

qqbot 的群聊默认是"来一条回一条"。这个补丁加一道闸：**群里没被 @ 时，只有"被叫到名字"或"命中兴趣词"才接话**，其余消息在进入模型之前就被丢弃——不调用模型、不消耗 token、群里也看不到任何回应。

| 群里的消息 | 结果 |
|---|---|
| @ 了机器人 | 回 |
| 含 `triggers`（默认：祖母绿 / 首席） | 回 |
| 含 `interests` 里的词（默认：百合、吐槽、低落、发明…） | 回 |
| 其他 | 静默 |

私聊不受影响。

## 安装

1. 先确保 `@tencent-connect/dsh-qqbot` 已安装在某个 dsh profile 里；
2. 运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\patches\attention-gate\apply.ps1
# 或者在多 profile 时指定：
powershell -ExecutionPolicy Bypass -File .\patches\attention-gate\apply.ps1 -Profile desktop
```

脚本会：自动找到已安装的 qqbot → 备份 `middleware-setup.js` → 复制 `attention-gate.js` → 幂等地插入两行 → 生成默认词表 `~/.dsh-qqbot/attention.json`。

3. **重启客户端**（插件代码在进程里缓存，热重载不会重新 import）。

## 词表（改完不用重启）

`~/.dsh-qqbot/attention.json`：

```json
{
  "enabled": true,
  "triggers": ["祖母绿", "首席"],
  "interests": ["百合", "吐槽", "低落", "发明", "权力机关", "蠢事", "好累", "难受", "emo", "无聊"]
}
```

- 改完按文件修改时间热读，下一轮消息生效；
- `enabled: false` 立刻恢复"每条都回"；
- 文件删掉则使用内置默认。

## 回滚

备份在 `~/.dsh-qqbot/backup/middleware-setup.js.orig-<时间戳>`：

```powershell
Copy-Item "$env:USERPROFILE\.dsh-qqbot\backup\middleware-setup.js.orig-<时间戳>" `
          "<profile>\node_modules\@tencent-connect\dsh-qqbot\dist\gateway\middleware-setup.js" -Force
```

然后重启。`attention-gate.js` 留着不影响（没被引用就不会加载）。

## 风险与边界

- **改的是别人的 `node_modules`**：qqbot 升级会覆盖，需要重跑 `apply.ps1`。
- **只做关键词匹配**：判断不了语义，聊具体作品/角色时若不出现词表里的词，仍会静默。
- **前置条件**：QQ 群要开「获取群内全部消息」（手机 QQ → 群设置 → 机器人），否则非 @ 的消息根本到不了插件。
- **`requireMention` 必须保持 `false`**，否则平台/mentionGate 会先挡掉非 @ 消息，闸看不到。
