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
import { cloneModels, getPath, hasPath } from '../src/core/paths.ts'
import {
  alignDraft,
  applySaveSuccess,
  draftDirty,
  generationIsCurrent,
  mergeLoadedDrafts,
  nextGeneration,
  routeDraftFromUserProfile,
  thinkingFormatChoices,
} from '../src/core/drafts.ts'
import { loadDrafts } from '../src/client/load-drafts.ts'
import { validateSaveDraft, type SchemaOps } from '../src/client/schema-ops.ts'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client'
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
    const compat = applyPresetCompat(
      { extra: true, supportsReasoningEffort: false },
      DEEPSEEK_PRESET,
    )
    expect(compat.thinkingFormat).toBe('deepseek')
    expect(compat.supportsDeveloperRole).toBe(false)
    expect(compat.supportsReasoningEffort).toBeUndefined()
    expect(compat.extra).toBe(true)
  })

  it('OpenAI preset replaces the dialect trio; extra compat keys stay', () => {
    expect(OPENAI_PRESET.efforts).toEqual({
      minimal: 'minimal',
      low: 'low',
      medium: 'medium',
      high: 'high',
    })
    expect(readOff(OPENAI_PRESET.efforts).mode).toBe('absent')
    expect(validateReasoningEfforts(OPENAI_PRESET.efforts)).toBeUndefined()
    const compat = applyPresetCompat(
      { thinkingFormat: 'deepseek', supportsDeveloperRole: false, extra: true },
      OPENAI_PRESET,
    )
    expect(compat.thinkingFormat).toBeUndefined()
    expect(compat.supportsDeveloperRole).toBeUndefined()
    expect(compat.supportsReasoningEffort).toBeUndefined()
    expect(compat.extra).toBe(true)
  })

  it('toggle preset unsets thinkingFormat/developer and sets supportsReasoningEffort false', () => {
    expect(TOGGLE_PRESET.efforts).toEqual({ off: null, high: 'high' })
    expect(TOGGLE_PRESET.warnSameWire).toBe(true)
    expect(validateReasoningEfforts(TOGGLE_PRESET.efforts)).toBeUndefined()
    const compat = applyPresetCompat(
      { thinkingFormat: 'deepseek', supportsDeveloperRole: false, extra: 1 },
      TOGGLE_PRESET,
    )
    expect(compat.thinkingFormat).toBeUndefined()
    expect(compat.supportsDeveloperRole).toBeUndefined()
    expect(compat.supportsReasoningEffort).toBe(false)
    expect(compat.extra).toBe(1)
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
    expect(validateReasoningEfforts({ high: 'high', unknown: 'x' })).toBe('bad-wire')
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
      settingsPath: ['providers', 'poke'],
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

const stubSchema: SchemaOps = {
  rehydrate: serialized => serialized,
  nodeAtPath: () => undefined,
  getPath,
  hasPath,
  validate: () => undefined,
}

function pokeDraft() {
  return routeDraftFromUserProfile({
    provider: 'poke',
    displayName: 'Poke',
    settingsPath: ['providers', 'poke'],
    revision: 1,
    userProfile: {
      models: [{ id: 'm1', reasoningEfforts: { high: 'high' } }],
      compat: { thinkingFormat: 'deepseek' },
    },
  })
}

describe('cloneModels', () => {
  it('drops non-object rows instead of synthesizing { id: "" }', () => {
    expect(cloneModels([{ id: 'ok' }, null, 'x', 1, ['arr']])).toEqual([{ id: 'ok' }])
    expect(cloneModels(undefined)).toEqual([])
  })
})

describe('draft dirty vs pathOps', () => {
  it('treats key-order-only changes as clean', () => {
    const draft = pokeDraft()
    draft.compat = { thinkingFormat: 'deepseek' }
    draft.originalCompat = { thinkingFormat: 'deepseek' }
    expect(draftDirty(draft)).toBe(false)
  })

  it('alignDraft clears dirty when ops would be empty', () => {
    const draft = pokeDraft()
    draft.models = [{ id: 'm1', reasoningEfforts: { high: 'high' } }]
    expect(draftDirty(alignDraft(draft))).toBe(false)
  })
})

describe('applySaveSuccess / mergeLoadedDrafts / generation', () => {
  it('bumps every card revision and realigns only the saved card', () => {
    const a = pokeDraft()
    const b = routeDraftFromUserProfile({
      provider: 'other',
      displayName: 'Other',
      settingsPath: ['providers', 'other'],
      revision: 1,
      userProfile: {
        models: [{ id: 'n1' }],
        compat: { extra: true },
      },
    })
    b.models = [{ id: 'n1', dirty: true }]
    const next = applySaveSuccess([a, b], 'poke', {
      revision: 4,
      user: {
        providers: {
          poke: {
            models: [{ id: 'm1', reasoningEfforts: { low: 'low' } }],
            compat: { thinkingFormat: 'openai' },
          },
        },
      },
    })
    expect(next[0]?.revision).toBe(4)
    expect(next[1]?.revision).toBe(4)
    expect(next[0]?.models).toEqual([{ id: 'm1', reasoningEfforts: { low: 'low' } }])
    expect(next[0]?.compat.thinkingFormat).toBe('openai')
    expect(next[1]?.models).toEqual([{ id: 'n1', dirty: true }])
    expect(next[1]?.compat.extra).toBe(true)
  })

  it('preserves dirty models/compat and reports conflict', () => {
    const current = pokeDraft()
    current.models = [{ id: 'm1', reasoningEfforts: { max: 'max' } }]
    const incoming = routeDraftFromUserProfile({
      provider: 'poke',
      displayName: 'Poke 2',
      settingsPath: ['providers', 'poke'],
      revision: 9,
      userProfile: {
        models: [{ id: 'm1', reasoningEfforts: { high: 'high' } }],
        compat: { thinkingFormat: 'openai' },
      },
    })
    const { drafts, conflicted } = mergeLoadedDrafts([current], [incoming], { preserveDirty: true })
    expect(conflicted).toEqual(['poke'])
    expect(drafts[0]?.models).toEqual([{ id: 'm1', reasoningEfforts: { max: 'max' } }])
    expect(drafts[0]?.revision).toBe(9)
    expect(drafts[0]?.originalModels).toEqual([{ id: 'm1', reasoningEfforts: { high: 'high' } }])
    expect(drafts[0]?.displayName).toBe('Poke 2')
  })

  it('discards stale generation tokens', () => {
    const holder = { current: 0 }
    const first = nextGeneration(holder)
    const second = nextGeneration(holder)
    expect(generationIsCurrent(holder, first)).toBe(false)
    expect(generationIsCurrent(holder, second)).toBe(true)
  })

  it('keeps an unknown thinkingFormat in the select options', () => {
    expect(thinkingFormatChoices(['openai', 'deepseek'], 'custom-gateway')).toEqual([
      'custom-gateway',
      'openai',
      'deepseek',
    ])
  })
})

describe('loadDrafts', () => {
  it('reads drafts from user, not effective value, and keeps settingsPath', async () => {
    const describe = {
      ensure: async () => {},
      getSnapshot: () => ({
        status: 'ready' as const,
        error: null,
        view: {
          writable: true,
          hasDocument: true,
          namespaces: [{
            ns: 'llm-pi-ai',
            schema: {},
            value: {
              providers: {
                poke: {
                  api: 'openai-completions',
                  models: [{ id: 'from-value' }],
                  compat: { thinkingFormat: 'from-value', leftover: true },
                },
              },
            },
            user: {
              providers: {
                poke: {
                  models: [{ id: 'from-user', reasoningEfforts: { low: 'low' } }],
                  compat: { thinkingFormat: 'deepseek' },
                },
              },
            },
            applies: 'live' as const,
            secrets: [],
            revision: 7,
          }],
        },
      }),
    } satisfies Pick<SettingsDescribeFace, 'ensure' | 'getSnapshot'>

    const api = {
      llm: {
        providers: async () => ({
          result: {
            ok: true as const,
            value: {
              providers: [{
                provider: 'poke',
                displayName: 'Poke',
                settingsNs: 'llm-pi-ai',
                settingsPath: ['providers', 'poke'],
                declared: true,
                active: false,
              }],
            },
          },
        }),
      },
    }

    const result = await loadDrafts(api as Pick<IApiClient, 'llm'>, describe, stubSchema)
    expect(result.error).toBeUndefined()
    expect(result.drafts).toHaveLength(1)
    expect(result.drafts[0]?.models[0]?.id).toBe('from-user')
    expect(result.drafts[0]?.compat.thinkingFormat).toBe('deepseek')
    expect(result.drafts[0]?.compat.leftover).toBeUndefined()
    expect(result.drafts[0]?.compatPresent).toBe(true)
    expect(result.drafts[0]?.settingsPath).toEqual(['providers', 'poke'])
    expect(result.drafts[0]?.revision).toBe(7)
  })

  it('does not treat missing user compat as present even if value has it', async () => {
    const describe = {
      ensure: async () => {},
      getSnapshot: () => ({
        status: 'ready' as const,
        error: null,
        view: {
          writable: true,
          hasDocument: true,
          namespaces: [{
            ns: 'llm-pi-ai',
            schema: {},
            value: {
              providers: {
                poke: {
                  api: 'openai-completions',
                  models: [{ id: 'base' }],
                  compat: { thinkingFormat: 'deepseek' },
                },
              },
            },
            user: {
              providers: {
                poke: {
                  models: [{ id: 'user' }],
                },
              },
            },
            applies: 'live' as const,
            secrets: [],
            revision: 1,
          }],
        },
      }),
    } satisfies Pick<SettingsDescribeFace, 'ensure' | 'getSnapshot'>

    const api = {
      llm: {
        providers: async () => ({
          result: {
            ok: true as const,
            value: {
              providers: [{
                provider: 'poke',
                displayName: 'Poke',
                settingsNs: 'llm-pi-ai',
                settingsPath: ['providers', 'poke'],
                declared: true,
              }],
            },
          },
        }),
      },
    }

    const result = await loadDrafts(api as Pick<IApiClient, 'llm'>, describe, stubSchema)
    expect(result.drafts[0]?.compatPresent).toBe(false)
    expect(result.drafts[0]?.compat).toEqual({})
    expect(result.drafts[0]?.models[0]?.id).toBe('user')
    expect(result.formats).toEqual([])
  })

  it('does not offer the handwritten thinkingFormat list when the live union is empty', async () => {
    const describe = {
      ensure: async () => {},
      getSnapshot: () => ({
        status: 'ready' as const,
        error: null,
        view: {
          writable: true,
          hasDocument: true,
          namespaces: [{
            ns: 'llm-pi-ai',
            schema: {},
            value: {},
            user: {},
            applies: 'live' as const,
            secrets: [],
            revision: 1,
          }],
        },
      }),
    } satisfies Pick<SettingsDescribeFace, 'ensure' | 'getSnapshot'>

    const api = {
      llm: {
        providers: async () => ({
          result: {
            ok: true as const,
            value: { providers: [] },
          },
        }),
      },
    }

    const emptyUnion: SchemaOps = {
      ...stubSchema,
      nodeAtPath: () => ({ type: 'union', list: [] }),
    }
    const thrown: SchemaOps = {
      ...stubSchema,
      rehydrate: () => {
        throw new Error('schema missing')
      },
    }
    expect((await loadDrafts(api as Pick<IApiClient, 'llm'>, describe, emptyUnion)).formats).toEqual([])
    expect((await loadDrafts(api as Pick<IApiClient, 'llm'>, describe, thrown)).formats).toEqual([])
    expect((await loadDrafts(api as Pick<IApiClient, 'llm'>, describe, stubSchema)).formats).toEqual([])
  })

  it('reads thinkingFormat choices from a live schema union', async () => {
    const describe = {
      ensure: async () => {},
      getSnapshot: () => ({
        status: 'ready' as const,
        error: null,
        view: {
          writable: true,
          hasDocument: true,
          namespaces: [{
            ns: 'llm-pi-ai',
            schema: {},
            value: {},
            user: {},
            applies: 'live' as const,
            secrets: [],
            revision: 1,
          }],
        },
      }),
    } satisfies Pick<SettingsDescribeFace, 'ensure' | 'getSnapshot'>

    const api = {
      llm: {
        providers: async () => ({
          result: {
            ok: true as const,
            value: { providers: [] },
          },
        }),
      },
    }

    const live: SchemaOps = {
      ...stubSchema,
      nodeAtPath: (_root, path) => (
        path[path.length - 1] === 'thinkingFormat'
          ? { type: 'union', list: [{ value: 'deepseek' }, { value: 'openai' }] }
          : undefined
      ),
    }
    expect((await loadDrafts(api as Pick<IApiClient, 'llm'>, describe, live)).formats).toEqual([
      'deepseek',
      'openai',
    ])
  })
})

describe('validateSaveDraft', () => {
  it('returns schema.validate text and does not invent a second validator', () => {
    const calls: unknown[] = []
    const schema: SchemaOps = {
      ...stubSchema,
      nodeAtPath: (_root, path) => path[path.length - 1] === 'models' ? { type: 'array' } : undefined,
      validate: (node, draft) => {
        calls.push({ node, draft })
        return Array.isArray(draft) ? undefined : 'bad models'
      },
    }
    expect(validateSaveDraft(schema, {}, ['providers', 'poke'], [{ id: 'm1' }], {}, false)).toBeUndefined()
    expect(validateSaveDraft(schema, {}, ['providers', 'poke'], { not: 'array' }, {}, false)).toBe('bad models')
    expect(calls).toHaveLength(2)
  })

  it('validates compat only when writing compat; missing nodes skip (do not mutate-block)', () => {
    const schema: SchemaOps = {
      ...stubSchema,
      nodeAtPath: (_root, path) => path[path.length - 1] === 'compat' ? { type: 'object' } : undefined,
      validate: (_node, draft) => (
        typeof draft === 'object' && draft !== null && 'thinkingFormat' in draft
        && (draft as { thinkingFormat: string }).thinkingFormat === 'nope'
          ? 'unknown format'
          : undefined
      ),
    }
    expect(validateSaveDraft(schema, {}, ['providers', 'poke'], [], { thinkingFormat: 'nope' }, false)).toBeUndefined()
    expect(validateSaveDraft(schema, {}, ['providers', 'poke'], [], { thinkingFormat: 'nope' }, true)).toBe('unknown format')
    expect(validateSaveDraft(stubSchema, {}, ['providers', 'poke'], [], { thinkingFormat: 'nope' }, true)).toBeUndefined()
  })

  it('blocks mutate when validate fails: callers must skip settings.mutate', () => {
    const schema: SchemaOps = {
      ...stubSchema,
      nodeAtPath: () => ({ type: 'array' }),
      validate: () => 'rejected by schema',
    }
    const error = validateSaveDraft(schema, {}, ['providers', 'poke'], [], {}, false)
    expect(error).toBe('rejected by schema')
    const mutate = error === undefined
    expect(mutate).toBe(false)
  })
})


