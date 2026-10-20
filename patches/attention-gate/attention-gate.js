/**
 * qqbot 注意力闸（补丁脚本用；不是独立插件）
 *
 * 群聊里没被 @ 时，只有"被叫到名字"或"命中兴趣词"才接话；
 * 其余消息在进入模型之前就被丢弃：不调用模型、不消耗 token、群里不留任何消息。
 *
 * 词表：~/.dsh-qqbot/attention.json（按文件 mtime 热读，改完不用重启）
 *   { "enabled": true, "triggers": ["祖母绿","首席"], "interests": ["百合", "..."] }
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CONFIG_FILE = path.join(os.homedir(), '.dsh-qqbot', 'attention.json')

const DEFAULTS = {
  enabled: true,
  triggers: ['祖母绿', '首席'],
  interests: ['百合', '吐槽', '低落', '发明', '权力机关', '蠢事', '好累', '难受', 'emo', '无聊'],
}

let cache = { mtimeMs: 0, data: DEFAULTS }

function pickList(value, fallback) {
  const list = Array.isArray(value) ? value.filter((x) => typeof x === 'string' && x.trim().length > 0) : []
  return list.length > 0 ? list : fallback
}

function loadConfig() {
  try {
    const stat = fs.statSync(CONFIG_FILE)
    if (stat.mtimeMs !== cache.mtimeMs) {
      const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
      cache = {
        mtimeMs: stat.mtimeMs,
        data: {
          enabled: raw.enabled !== false,
          triggers: pickList(raw.triggers, DEFAULTS.triggers),
          interests: pickList(raw.interests, DEFAULTS.interests),
        },
      }
    }
  } catch {
    /* 文件缺失或损坏：静默用默认词表 */
  }
  return cache.data
}

const hit = (text, words) => words.some((w) => text.includes(w))

export function attentionGate(logger) {
  return async (ctx, next) => {
    const message = ctx.message
    if (message.kind !== 'group') return next()            // 私聊：不设闸
    const { enabled, triggers, interests } = loadConfig()
    if (!enabled) return next()                            // 总开关

    if (ctx.state.mention?.wasMentioned) return next()     // 被 @：放行

    const text = String(message.content ?? '')
    if (text.trimStart().startsWith('/')) return next()    // 斜杠命令兜底
    if (hit(text, triggers)) return next()                 // 叫名字
    if (hit(text, interests)) return next()                // 兴趣词

    logger?.debug?.(`[attention] skip (${text.length} chars): ${text.slice(0, 40)}`)
    ctx.stop('attention:skip')                             // 静默丢弃
  }
}
