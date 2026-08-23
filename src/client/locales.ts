/**
 * Dictionary namespace for the effort-declare settings section.
 */

export type EffortDeclareKey =
  | 'nav'
  | 'title'
  | 'intro'
  | 'empty'
  | 'emptyHint'
  | 'loadError'
  | 'loading'
  | 'readOnly'
  | 'save'
  | 'saving'
  | 'saveBusy'
  | 'cancel'
  | 'saved'
  | 'conflict'
  | 'dirtyConflict'
  | 'presets'
  | 'presetDeepSeek'
  | 'presetOpenAI'
  | 'presetToggle'
  | 'presetToggleWarn'
  | 'model'
  | 'levels'
  | 'wire'
  | 'offMode'
  | 'offAbsent'
  | 'offEmpty'
  | 'offValue'
  | 'offValuePlaceholder'
  | 'clear'
  | 'advanced'
  | 'thinkingFormat'
  | 'thinkingFormatDefault'
  | 'supportsDeveloperRole'
  | 'supportsReasoningEffort'
  | 'developerTrueHint'
  | 'compatSummary'
  | 'errorEmpty'
  | 'errorOffOnly'
  | 'errorBadWire'
  | 'noModels'
  | 'reload'

export const NS = 'plugin-effort-declare'

export const zh: Record<EffortDeclareKey, string> = {
  nav: '推理档位',
  title: '推理档位声明',
  intro: '本页声明「这模型能选哪些推理档」。对话里的档位选择仍在输入框模型菜单。没声明 = 和现在一样没有 Effort 行。不会改密钥、目录或当次选择。',
  empty: '没有可编辑的手工 openai-completions 路由。',
  emptyHint: '请先到「模型」页添加提供方（llm-pi-ai 手工路由）。官方 DeepSeek 与 catalog 路由不在本页编辑。需要 DSH ≥ 0.1.0-rc.8（providers.declared）。',
  loadError: '无法加载提供方或设置。',
  loading: '正在加载…',
  readOnly: '当前设置为只读，无法保存。',
  save: '保存',
  saving: '保存中…',
  saveBusy: '另有路由正在保存，请稍候。',
  cancel: '取消',
  saved: '已保存。对话选择器会按新的能力声明显示 Effort 行。',
  conflict: '设置已被其他地方改过，请重新加载后再保存。',
  dirtyConflict: '此路由有未保存修改，设置已在其他地方更新。保存会写到最新文档上，或先取消再改。',
  presets: '预设',
  presetDeepSeek: 'DeepSeek 兼容',
  presetOpenAI: 'OpenAI 兼容',
  presetToggle: '仅开/关',
  presetToggleWarn: '选择器里多档在线上没有区别：除 Off 外请求体相同。',
  model: '模型',
  levels: '可选档位',
  wire: '线上拼写',
  offMode: 'Off',
  offAbsent: '无 Off',
  offEmpty: 'Off 且不发参数',
  offValue: 'Off 且发字符串',
  offValuePlaceholder: 'none',
  clear: '清除本模型声明',
  advanced: '高级：协议方言',
  thinkingFormat: 'thinkingFormat',
  thinkingFormatDefault: '默认（省略该键）',
  supportsDeveloperRole: '系统提示走 system 而不是 developer（supportsDeveloperRole: false）',
  supportsReasoningEffort: '不发 reasoning_effort，只发开关（supportsReasoningEffort: false）',
  developerTrueHint: '当前文档是 supportsDeveloperRole: true。v1 只能强制 false 或缺席；勾选会写成 false，取消勾选会删除该键。',
  compatSummary: '协议',
  errorEmpty: '不能保存空的 reasoningEfforts。请选择档位，或清除声明。',
  errorOffOnly: '不能只开 Off，必须再开一档思考档。',
  errorBadWire: '思考档必须填写线上拼写；只有 Off 可以留空。不能使用未知档位键。',
  noModels: '这条路由还没有 models 列表。请先到「模型」页添加模型。',
  reload: '重新加载',
}

export const en: Record<EffortDeclareKey, string> = {
  nav: 'Reasoning efforts',
  title: 'Reasoning effort declarations',
  intro: 'This page declares which reasoning levels a model can offer. The per-turn choice stays in the composer model menu. Undeclared models keep having no Effort row. Keys, catalogs, and the current selection are not edited here.',
  empty: 'No editable hand-declared openai-completions routes.',
  emptyHint: 'Add a provider on the Models page first (an llm-pi-ai hand-declared route). Official DeepSeek and catalog routes are not edited here. Requires DSH ≥ 0.1.0-rc.8 (providers.declared).',
  loadError: 'Could not load providers or settings.',
  loading: 'Loading…',
  readOnly: 'Settings are read-only; saving is disabled.',
  save: 'Save',
  saving: 'Saving…',
  saveBusy: 'Another route is saving. Wait, then save this card.',
  cancel: 'Cancel',
  saved: 'Saved. The composer Effort row follows this capability declaration.',
  conflict: 'Settings changed elsewhere. Reload, then save again.',
  dirtyConflict: 'This route has unsaved edits and settings changed elsewhere. Save writes onto the latest document, or cancel first.',
  presets: 'Presets',
  presetDeepSeek: 'DeepSeek compatible',
  presetOpenAI: 'OpenAI compatible',
  presetToggle: 'On/off only',
  presetToggleWarn: 'Multiple selector levels are identical on the wire except Off.',
  model: 'Model',
  levels: 'Offered levels',
  wire: 'Wire spelling',
  offMode: 'Off',
  offAbsent: 'No Off',
  offEmpty: 'Off, send nothing',
  offValue: 'Off, send a string',
  offValuePlaceholder: 'none',
  clear: 'Clear this model’s declaration',
  advanced: 'Advanced: protocol dialect',
  thinkingFormat: 'thinkingFormat',
  thinkingFormatDefault: 'Default (omit the key)',
  supportsDeveloperRole: 'Send system prompts as system, not developer (supportsDeveloperRole: false)',
  supportsReasoningEffort: 'Do not send reasoning_effort; switch only (supportsReasoningEffort: false)',
  developerTrueHint: 'The document has supportsDeveloperRole: true. v1 can only force false or omit the key; checking writes false, unchecking deletes the key.',
  compatSummary: 'Protocol',
  errorEmpty: 'Empty reasoningEfforts cannot be saved. Pick levels, or clear the declaration.',
  errorOffOnly: 'Off alone is not enough; declare at least one thinking level.',
  errorBadWire: 'Thinking levels need a wire spelling; only Off may be empty. Unknown effort keys are rejected.',
  noModels: 'This route has no models list yet. Add models on the Models page first.',
  reload: 'Reload',
}
