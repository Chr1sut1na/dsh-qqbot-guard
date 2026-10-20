window.__ModuleLoader__.load({
  id: "dsh-qqbot-guard",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    let react = require("react")
    const h = react.createElement
    const useState = react.useState
    const useEffect = react.useEffect

    const API = "/qqbot-guard/config"

    /** 与 dsh 设置面板一致的样式（全部走 --dsw-alias-* 设计 token，明暗主题自适应） */
    const CSS = `
      .qqg-root { padding: 20px 24px 28px; max-width: 720px; box-sizing: border-box; color: var(--dsw-alias-label-primary); }
      .qqg-title { margin: 0 0 4px; font-size: 15px; font-weight: 600; line-height: 22px; color: var(--dsw-alias-label-primary); }
      .qqg-sub { margin: 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-tertiary); }
      .qqg-group-title { padding: 18px 0 2px; font-size: 12px; font-weight: 600; line-height: 18px; color: var(--dsw-alias-label-tertiary); text-transform: uppercase; letter-spacing: .04em; }
      .qqg-field { display: flex; flex-direction: column; gap: 6px; padding: 12px 0; }
      .qqg-field + .qqg-field { border-top: 0.5px solid var(--dsw-alias-border-l2); }
      .qqg-head { display: flex; align-items: center; gap: 8px; min-height: 28px; }
      .qqg-label { flex: 1; min-width: 0; font-size: 13px; font-weight: 500; line-height: 1.5; color: var(--dsw-alias-label-primary); }
      .qqg-hint { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
      .qqg-switch { box-sizing: border-box; position: relative; flex: 0 0 auto; width: 36px; height: 20px; padding: 2px; border: 0; border-radius: 999px; background: var(--dsw-alias-border-l3); cursor: pointer; font: inherit; transition: background 120ms ease; }
      .qqg-switch[aria-checked='true'] { background: var(--dsw-alias-brand-primary); }
      .qqg-switch:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
      .qqg-switch-thumb { display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-switch-thumb, #ffffff); transition: transform 120ms ease; }
      .qqg-switch[aria-checked='true'] .qqg-switch-thumb { background: var(--dsw-alias-label-primary-foreground, #ffffff); transform: translateX(16px); }
      .qqg-input { box-sizing: border-box; width: 100%; height: 34px; padding: 0 12px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-md, 8px); background: var(--dsw-alias-bg-layer-3); font: inherit; font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-primary); outline: none; }
      .qqg-input:focus { border-color: var(--dsw-alias-state-business-primary); }
      .qqg-textarea { box-sizing: border-box; width: 100%; min-height: 150px; padding: 10px 12px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: var(--dsw-radius-md, 8px); background: var(--dsw-alias-bg-layer-3); font: inherit; font-size: 13px; line-height: 1.7; color: var(--dsw-alias-label-primary); outline: none; resize: vertical; }
      .qqg-textarea:focus { border-color: var(--dsw-alias-state-business-primary); }
      .qqg-footer { display: flex; align-items: center; gap: 8px; padding-top: 16px; }
      .qqg-note { flex: 1; min-width: 0; margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
      .qqg-note--ok { color: var(--dsw-alias-label-secondary); }
      .qqg-note--error { color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-error)); }
      .qqg-save { appearance: none; flex: none; border: 1px solid transparent; border-radius: var(--dsw-radius-md, 8px); padding: 5px 14px; font: inherit; font-size: 13px; line-height: 1.5; cursor: pointer; background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-layer-3); }
      .qqg-save:disabled { opacity: 0.4; cursor: default; }
      .qqg-reset { appearance: none; flex: none; border: 1px solid var(--dsw-alias-border-l3); border-radius: var(--dsw-radius-md, 8px); padding: 5px 14px; font: inherit; font-size: 13px; line-height: 1.5; cursor: pointer; background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); }
      .qqg-reset:disabled { opacity: 0.4; cursor: default; }
      .qqg-save:focus-visible, .qqg-reset:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 1px; }
      .qqg-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 22px; padding-top: 16px; border-top: 0.5px solid var(--dsw-alias-border-l2); }
      .qqg-stat { padding: 10px 12px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-md, 8px); background: var(--dsw-alias-bg-layer-3); }
      .qqg-stat-label { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); }
      .qqg-stat-value { margin-top: 2px; font-size: 16px; font-weight: 600; line-height: 22px; color: var(--dsw-alias-label-primary); }
      .qqg-meta { margin: 10px 0 0; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-tertiary); }
    `

    function useStyle() {
      useEffect(() => {
        const style = document.createElement("style")
        style.textContent = CSS
        document.head.appendChild(style)
        return () => style.remove()
      }, [])
    }

    function Switch({ checked, label, disabled, onChange }) {
      return h("button", {
        type: "button",
        role: "switch",
        "aria-checked": checked,
        "aria-label": label,
        className: "qqg-switch",
        disabled: !!disabled,
        onClick: () => onChange(!checked),
      }, h("span", { className: "qqg-switch-thumb" }))
    }

    function GuardPanel() {
      useStyle()
      const [cfg, setCfg] = useState(null)
      const [form, setForm] = useState({ enabled: true, text: "", allow: "" })
      const [busy, setBusy] = useState(false)
      const [note, setNote] = useState({ kind: "", text: "" })
      const [error, setError] = useState("")

      const applyData = (data) => {
        setCfg(data)
        setForm({
          enabled: !!data.config?.enabled,
          text: data.config?.rule?.text ?? "",
          allow: (data.config?.tools?.allow ?? []).join(", "),
        })
      }

      const load = () => {
        setError("")
        fetch(API, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
          .then(applyData)
          .catch((e) => setError("加载失败：" + (e && e.message ? e.message : String(e))))
      }

      useEffect(() => {
        load()
      }, [])

      const post = (payload, okText) => {
        setBusy(true)
        setNote({ kind: "", text: "" })
        setError("")
        fetch(API, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
          .then((data) => {
            applyData(data)
            setNote({ kind: "ok", text: okText })
          })
          .catch((e) => setError("保存失败：" + (e && e.message ? e.message : String(e))))
          .finally(() => setBusy(false))
      }

      const dirty =
        cfg !== null &&
        (form.enabled !== !!cfg.config?.enabled ||
          form.text !== (cfg.config?.rule?.text ?? "") ||
          form.allow !== (cfg.config?.tools?.allow ?? []).join(", "))

      const sourceLabel =
        cfg?.config?.rule?.source === "override"
          ? "自定义"
          : cfg?.config?.rule?.source === "yaml"
            ? "配置文件"
            : "内置默认"

      return h("div", { className: "qqg-root" },
        h("h1", { className: "qqg-title" }, "QQ 机器人边界守卫"),
        h("p", { className: "qqg-sub" }, "工具白名单 + 角色内回避约束。改动保存后立即生效，无需重启。"),

        h("div", { className: "qqg-group-title" }, "角色约束"),
        h("div", { className: "qqg-field" },
          h("div", { className: "qqg-head" },
            h("span", { className: "qqg-label" }, "启用角色约束规则"),
            h(Switch, {
              checked: form.enabled,
              label: "启用角色约束规则",
              disabled: busy,
              onChange: (v) => setForm({ ...form, enabled: v }),
            })),
          h("p", { className: "qqg-hint" }, "关闭后：约束提示词不注入（工具白名单仍然生效）。")),
        h("div", { className: "qqg-field" },
          h("span", { className: "qqg-label" }, "约束提示词"),
          h("textarea", {
            className: "qqg-textarea",
            value: form.text,
            spellCheck: false,
            onChange: (e) => setForm({ ...form, text: e.target.value }),
          }),
          h("p", { className: "qqg-hint" },
            "来源：" + sourceLabel + " · " + form.text.length + " 字。留空即使用内置默认；建议保持简短，避免稀释角色设定。")),

        h("div", { className: "qqg-group-title" }, "工具白名单"),
        h("div", { className: "qqg-field" },
          h("span", { className: "qqg-label" }, "允许 QQ 机器人使用的工具（逗号分隔）"),
          h("input", {
            className: "qqg-input",
            value: form.allow,
            spellCheck: false,
            onChange: (e) => setForm({ ...form, allow: e.target.value }),
          }),
          h("p", { className: "qqg-hint" }, "留空表示不限制工具（不推荐）。默认：web_search, web_fetch")),

        h("div", { className: "qqg-footer" },
          h("button", {
            className: "qqg-save",
            type: "button",
            disabled: busy || !dirty,
            onClick: () => post({
              enabled: form.enabled,
              text: form.text,
              allow: form.allow.split(",").map((s) => s.trim()).filter(Boolean),
            }, "已保存，下一轮 QQ 消息即生效"),
          }, busy ? "保存中…" : "保存"),
          h("button", {
            className: "qqg-reset",
            type: "button",
            disabled: busy,
            onClick: () => post({ reset: true }, "已恢复默认"),
          }, "恢复默认"),
          h("p", { className: note.kind === "error" ? "qqg-note qqg-note--error" : "qqg-note qqg-note--ok" }, note.text)),

        error ? h("p", { className: "qqg-note qqg-note--error" }, error) : null,

        cfg?.stats ? h("div", null,
          h("div", { className: "qqg-stats" },
            h("div", { className: "qqg-stat" },
              h("div", { className: "qqg-stat-label" }, "命中会话"),
              h("div", { className: "qqg-stat-value" }, String(cfg.stats.matched))),
            h("div", { className: "qqg-stat" },
              h("div", { className: "qqg-stat-label" }, "移除工具"),
              h("div", { className: "qqg-stat-value" }, String(cfg.stats.removedTools))),
            h("div", { className: "qqg-stat" },
              h("div", { className: "qqg-stat-label" }, "注入规则"),
              h("div", { className: "qqg-stat-value" }, String(cfg.stats.injectedRules)))),
          h("p", { className: "qqg-meta" },
            "最近命中依据：" + (cfg.stats.lastMatchedBy || "—") +
            " · 最近放行工具：" + (cfg.stats.lastToolNames && cfg.stats.lastToolNames.length ? cfg.stats.lastToolNames.join(", ") : "—") +
            " · 版本 " + cfg.version)) : null)
    }

    function apply(ctx) {
      const slots = ctx.slots
      if (slots === undefined || typeof slots.inject !== "function") return
      slots.inject("settings.section", () => slots.register({
        name: "settings.section",
        id: "qqbot-guard",
        order: 8,
        label: "QQ 机器人边界守卫",
      }, GuardPanel))
    }

    exports.name = "dsh-qqbot-guard-client"
    exports.inject = ["slots"]
    exports.apply = apply
    return module.exports
  }
})
