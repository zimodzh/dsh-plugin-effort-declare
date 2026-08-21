import { describe, expect, it } from 'vitest'
import { FALLBACK_THINKING_FORMATS, THINKING_LEVELS } from '../src/core/catalog.ts'
import {
  clearReasoningEfforts,
  readOff,
  validateReasoningEfforts,
  writeEfforts,
  writeOff,
} from '../src/core/efforts.ts'
import { classifyRoute, unionStringChoices } from '../src/core/filter.ts'
import { buildSaveOps, pathOps } from '../src/core/path-ops.ts'
import {
  applyPresetCompat,
  applyPresetEfforts,
  DEEPSEEK_PRESET,
  OPENAI_PRESET,
  TOGGLE_PRESET,
} from '../src/core/presets.ts'

describe('catalog pin', () => {
  it('pins thinking levels to the llm-pi-ai rc.8 set', () => {
    expect([...THINKING_LEVELS]).toEqual(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
  })

  it('pins thinkingFormat fallback to the llm-pi-ai rc.8 set', () => {
    expect([...FALLBACK_THINKING_FORMATS]).toEqual([
      'openai',
      'deepseek',
      'openrouter',
      'together',
      'zai',
      'qwen',
      'chat-template',
      'qwen-chat-template',
      'string-thinking',
      'ant-ling',
    ])
  })

  it('reads thinkingFormat choices from a schema union node', () => {
    const node = {
      type: 'union',
      list: FALLBACK_THINKING_FORMATS.map(value => ({ value })),
    }
    expect(unionStringChoices(node)).toEqual([...FALLBACK_THINKING_FORMATS])
  })
})

describe('presets', () => {
  it('DeepSeek preset: off empty + low/high/max identity, deepseek dialect', () => {
    expect(DEEPSEEK_PRESET.efforts).toEqual({
      off: null,
      low: 'low',
      high: 'high',
      max: 'max',
    })
    expect(readOff(DEEPSEEK_PRESET.efforts).mode).toBe('empty')
    expect(validateReasoningEfforts(DEEPSEEK_PRESET.efforts)).toBeUndefined()
    const compat = applyPresetCompat({ extra: true }, DEEPSEEK_PRESET)
    expect(compat.thinkingFormat).toBe('deepseek')
    expect(compat.supportsDeveloperRole).toBe(false)
    expect(compat.extra).toBe(true)
  })

  it('OpenAI preset: four thinking levels, unsets thinkingFormat, does not force developer=false', () => {
    expect(OPENAI_PRESET.efforts).toEqual({
      minimal: 'minimal',
      low: 'low',
      medium: 'medium',
      high: 'high',
    })
    expect(readOff(OPENAI_PRESET.efforts).mode).toBe('absent')
    expect(validateReasoningEfforts(OPENAI_PRESET.efforts)).toBeUndefined()
    const compat = applyPresetCompat(
      { thinkingFormat: 'deepseek', supportsDeveloperRole: false },
      OPENAI_PRESET,
    )
    expect(compat.thinkingFormat).toBeUndefined()
    expect(compat.supportsDeveloperRole).toBe(false)
  })

  it('toggle preset: off+high and supportsReasoningEffort false, with the same-wire warning', () => {
    expect(TOGGLE_PRESET.efforts).toEqual({ off: null, high: 'high' })
    expect(TOGGLE_PRESET.warnSameWire).toBe(true)
    expect(validateReasoningEfforts(TOGGLE_PRESET.efforts)).toBeUndefined()
    const compat = applyPresetCompat({}, TOGGLE_PRESET)
    expect(compat.supportsReasoningEffort).toBe(false)
  })

  it('preset efforts spread onto existing model rows', () => {
    const rows = applyPresetEfforts(
      [{ id: 'm1', name: 'One', contextWindow: 128000, hidden: 1 }],
      DEEPSEEK_PRESET,
    )
    expect(rows[0]).toMatchObject({
      id: 'm1',
      name: 'One',
      contextWindow: 128000,
      hidden: 1,
      reasoningEfforts: DEEPSEEK_PRESET.efforts,
    })
  })
})

describe('off tri-state', () => {
  it('absent / empty / value stay distinct', () => {
    expect(readOff({ high: 'high' }).mode).toBe('absent')
    expect(readOff({ off: null, high: 'high' }).mode).toBe('empty')
    expect(readOff({ off: 'none', high: 'high' })).toEqual({ mode: 'value', value: 'none' })
    expect(writeOff({ high: 'high' }, 'empty', 'none')).toEqual({ high: 'high', off: null })
    expect(writeOff({ high: 'high' }, 'value', 'none')).toEqual({ high: 'high', off: 'none' })
    expect(writeOff({ off: null, high: 'high' }, 'absent', 'none')).toEqual({ high: 'high' })
  })
})

describe('validation (never throws)', () => {
  it('rejects empty object and off-only without throwing', () => {
    expect(validateReasoningEfforts({})).toBe('empty')
    expect(validateReasoningEfforts(null)).toBe('empty')
    expect(validateReasoningEfforts({ off: null })).toBe('off-only')
    expect(validateReasoningEfforts({ off: 'none' })).toBe('off-only')
    expect(validateReasoningEfforts({ low: null })).toBe('bad-wire')
    expect(validateReasoningEfforts(undefined)).toBeUndefined()
    expect(validateReasoningEfforts(false)).toBeUndefined()
  })
})

describe('clear declaration', () => {
  it('unsets reasoningEfforts and keeps id/name/hidden fields', () => {
    const cleared = clearReasoningEfforts({
      id: 'deepseek-v4-pro',
      name: 'Pro',
      contextWindow: 1,
      reasoningEfforts: { off: null, high: 'high' },
      compat: { thinkingFormat: 'deepseek' },
    })
    expect(cleared).toEqual({
      id: 'deepseek-v4-pro',
      name: 'Pro',
      contextWindow: 1,
      compat: { thinkingFormat: 'deepseek' },
    })
    expect('reasoningEfforts' in cleared).toBe(false)
  })

  it('writeEfforts(undefined) also unsets rather than writing false', () => {
    const row = writeEfforts({ id: 'x', reasoningEfforts: { high: 'high' } }, undefined)
    expect(row).toEqual({ id: 'x' })
  })
})

describe('path ops', () => {
  it('replaces the whole models table and keeps hidden fields on unedited rows', () => {
    const before = [
      { id: 'keep', name: 'Keep', contextWindow: 64000, maxTokens: 4096, secret: true },
      { id: 'edit', name: 'Edit', contextWindow: 128000 },
    ]
    const after = [
      { ...before[0] },
      { ...before[1], reasoningEfforts: { high: 'high', max: 'max' } },
    ]
    const ops = buildSaveOps({
      route: 'poke',
      beforeModels: before,
      afterModels: after,
      beforeCompat: { thinkingFormat: 'deepseek', supportsDeveloperRole: false },
      afterCompat: { thinkingFormat: 'deepseek', supportsDeveloperRole: false },
    })
    expect(ops).toEqual([
      { op: 'set', path: ['providers', 'poke', 'models'], value: after },
    ])
    const kept = (ops[0] as { value: Record<string, unknown>[] }).value[0]
    expect(kept.secret).toBe(true)
    expect(kept.contextWindow).toBe(64000)
    expect(kept.maxTokens).toBe(4096)
  })

  it('emits no compat op when compat is unchanged', () => {
    const compat = { thinkingFormat: 'deepseek' }
    expect(pathOps(['providers', 'poke', 'compat'], compat, { ...compat })).toEqual([])
  })

  it('unsets a compat key that disappeared, without replacing the section', () => {
    const ops = pathOps(
      ['providers', 'poke', 'compat'],
      { thinkingFormat: 'deepseek', supportsDeveloperRole: false },
      { supportsDeveloperRole: false },
    )
    expect(ops).toEqual([
      { op: 'unset', path: ['providers', 'poke', 'compat', 'thinkingFormat'] },
    ])
  })
})

describe('route filter', () => {
  it('keeps hand-declared llm-pi-ai openai-completions routes', () => {
    expect(classifyRoute(
      { provider: 'poke', settingsNs: 'llm-pi-ai', declared: true },
      { api: 'openai-completions' },
    )).toEqual({ editable: true })
  })

  it('treats missing api as openai-completions after schema default', () => {
    expect(classifyRoute(
      { provider: 'llm-all', settingsNs: 'llm-pi-ai', declared: true },
      { displayName: 'all' },
    ).editable).toBe(true)
    expect(classifyRoute(
      { provider: 'x', settingsNs: 'llm-pi-ai', declared: true },
      {},
      'anthropic-messages',
    )).toEqual({ editable: false, reason: 'not-completions' })
  })

  it('skips catalog, official DeepSeek, and non-completions', () => {
    expect(classifyRoute(
      { provider: 'openai', settingsNs: 'llm-pi-ai', declared: false },
      { api: 'openai-completions' },
    )).toEqual({ editable: false, reason: 'catalog' })
    expect(classifyRoute(
      { provider: 'deepseek-official', settingsNs: 'llm-deepseek', declared: true },
      {},
    )).toEqual({ editable: false, reason: 'official-deepseek' })
    expect(classifyRoute(
      { provider: 'ds', settingsNs: 'llm-deepseek' },
      {},
    )).toEqual({ editable: false, reason: 'official-deepseek' })
    expect(classifyRoute(
      { provider: 'claude', settingsNs: 'llm-pi-ai', declared: true },
      { api: 'anthropic-messages' },
    )).toEqual({ editable: false, reason: 'not-completions' })
    expect(classifyRoute(
      { provider: 'other', settingsNs: 'something-else', declared: true },
      { api: 'openai-completions' },
    )).toEqual({ editable: false, reason: 'not-pi-ai' })
  })
})
