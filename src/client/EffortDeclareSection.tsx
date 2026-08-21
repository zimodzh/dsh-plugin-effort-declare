/**
 * Settings section: per-model reasoningEfforts + openai-completions compat
 * for hand-declared llm-pi-ai routes.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { IApiClient, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  FALLBACK_THINKING_FORMATS,
  LLM_PI_AI_NS,
  SCHEMA_PROBE_ROUTE,
  THINKING_LEVELS_WITHOUT_OFF,
} from '../core/catalog.ts'
import { classifyRoute, profileAt, unionStringChoices } from '../core/filter.ts'
import {
  hasLevel,
  readEfforts,
  readOff,
  setWireSpelling,
  toggleLevel,
  writeEfforts,
  writeOff,
  clearReasoningEfforts,
} from '../core/efforts.ts'
import { applyPresetCompat, applyPresetEfforts, PRESETS, type PresetId } from '../core/presets.ts'
import { buildSaveOps } from '../core/path-ops.ts'
import { cloneModels, cloneObject, isPlainObject } from '../core/paths.ts'
import { modelEffortError } from '../core/validate.ts'
import type { SchemaOps } from './schema-ops.ts'
import type { EffortDeclareKey } from './locales.ts'
import css from './effort-declare.module.css'

export interface EffortDeclareSectionInjected {
  api: Pick<IApiClient, 'settings' | 'llm'>
  describe: SettingsDescribeFace
  schema: SchemaOps
  t: (key: EffortDeclareKey) => string
  onInvalidate: (listener: () => void) => () => void
}

export interface EffortDeclareSectionProps extends Partial<EffortDeclareSectionInjected> {
  t: (key: EffortDeclareKey) => string
  close: () => void
}

interface RouteDraft {
  provider: string
  displayName: string
  revision: number
  models: Record<string, unknown>[]
  originalModels: Record<string, unknown>[]
  compat: Record<string, unknown>
  originalCompat: Record<string, unknown>
  compatPresent: boolean
}

function schemaDefaultString(node: unknown): string | undefined {
  if (!isPlainObject(node) || !isPlainObject(node.meta)) return undefined
  return typeof node.meta.default === 'string' ? node.meta.default : undefined
}

function compatSummary(compat: Record<string, unknown>): string {
  const parts: string[] = []
  if (typeof compat.thinkingFormat === 'string') parts.push(`thinkingFormat=${compat.thinkingFormat}`)
  if (compat.supportsDeveloperRole === false) parts.push('supportsDeveloperRole=false')
  if (compat.supportsReasoningEffort === false) parts.push('supportsReasoningEffort=false')
  return parts.join(' · ')
}

function dirty(draft: RouteDraft): boolean {
  return JSON.stringify(draft.models) !== JSON.stringify(draft.originalModels)
    || JSON.stringify(draft.compat) !== JSON.stringify(draft.originalCompat)
}

function errorText(code: ReturnType<typeof modelEffortError>, t: (key: EffortDeclareKey) => string): string | undefined {
  if (code === 'empty') return t('errorEmpty')
  if (code === 'off-only') return t('errorOffOnly')
  if (code === 'bad-wire') return t('errorBadWire')
  return undefined
}

/**
 * Load editable route drafts from llm.providers + the llm-pi-ai namespace.
 */
export async function loadDrafts(
  api: Pick<IApiClient, 'llm'>,
  describe: SettingsDescribeFace,
  schema: SchemaOps,
): Promise<{ writable: boolean; formats: string[]; drafts: RouteDraft[]; error?: string }> {
  await describe.ensure()
  const mirrored = describe.getSnapshot()
  if (mirrored.view === undefined) {
    return { writable: false, formats: [...FALLBACK_THINKING_FORMATS], drafts: [], error: mirrored.error ?? undefined }
  }
  const providersResponse = await api.llm.providers({})
  if (!providersResponse.result.ok) {
    return {
      writable: mirrored.view.writable,
      formats: [...FALLBACK_THINKING_FORMATS],
      drafts: [],
      error: providersResponse.result.error.message,
    }
  }
  const namespaces = new Map(mirrored.view.namespaces.map((view: SettingsNamespaceView) => [view.ns, view]))
  const pi = namespaces.get(LLM_PI_AI_NS)
  let formats: string[] = [...FALLBACK_THINKING_FORMATS]
  let schemaDefaultApi: string | undefined
  if (pi !== undefined) {
    try {
      const root = schema.rehydrate(pi.schema)
      const formatNode = schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'compat', 'thinkingFormat'])
      const fromSchema = unionStringChoices(formatNode)
      if (fromSchema.length > 0) formats = fromSchema
      schemaDefaultApi = schemaDefaultString(schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'api']))
    } catch {
      // Live schema walk is best-effort; fallback list is test-pinned.
    }
  }
  const drafts: RouteDraft[] = []
  for (const entry of providersResponse.result.value.providers) {
    const profile = profileAt(pi?.value, entry.settingsPath, entry.provider)
    if (!classifyRoute(entry, profile, schemaDefaultApi).editable) continue
    const models = cloneModels(isPlainObject(profile) ? profile.models : [])
    const compatPresent = isPlainObject(profile) && isPlainObject(profile.compat)
    const compat = cloneObject(isPlainObject(profile) ? profile.compat : {})
    drafts.push({
      provider: entry.provider,
      displayName: entry.displayName,
      revision: pi?.revision ?? 0,
      models,
      originalModels: cloneModels(models),
      compat,
      originalCompat: cloneObject(compat),
      compatPresent,
    })
  }
  return { writable: mirrored.view.writable, formats, drafts }
}

function ModelRowEditor(props: {
  row: Record<string, unknown>
  index: number
  disabled: boolean
  t: (key: EffortDeclareKey) => string
  onChange: (row: Record<string, unknown>) => void
}): ReactNode {
  const { row, index, disabled, t, onChange } = props
  const efforts = readEfforts(row) ?? {}
  const off = readOff(readEfforts(row))
  const err = errorText(modelEffortError(row), t)
  const id = typeof row.id === 'string' ? row.id : ''
  const name = typeof row.name === 'string' ? row.name : ''

  const patchEfforts = (next: typeof efforts): void => {
    onChange(writeEfforts(row, Object.keys(next).length === 0 ? undefined : next))
  }

  return (
    <div className={css.modelEntry}>
      <div className={css.modelHead}>
        <span className={css.modelId}>{id || t('model')}</span>
        {name !== '' && name !== id ? <span className={css.modelName}>{name}</span> : null}
        <button
          type="button"
          className={css.linkButton}
          disabled={disabled || !('reasoningEfforts' in row)}
          onClick={() => { onChange(clearReasoningEfforts(row)) }}
        >
          {t('clear')}
        </button>
      </div>
      <span className={css.fieldLabel}>{t('levels')}</span>
      <div className={css.levels}>
        {THINKING_LEVELS_WITHOUT_OFF.map((level) => (
          <label key={level} className={css.level}>
            <input
              type="checkbox"
              checked={hasLevel(efforts, level)}
              disabled={disabled}
              onChange={(event) => { patchEfforts(toggleLevel(efforts, level, event.target.checked)) }}
            />
            {level}
          </label>
        ))}
      </div>
      <div className={css.wireRow}>
        <span className={css.fieldLabel}>{t('wire')}</span>
        {THINKING_LEVELS_WITHOUT_OFF.filter(level => hasLevel(efforts, level)).map((level) => (
          <label key={level} className={css.level}>
            {level}
            <input
              className={`${css.input} ${css.wireInput}`}
              type="text"
              value={efforts[level] ?? level}
              disabled={disabled}
              aria-label={`${t('wire')} ${level}`}
              onChange={(event) => { patchEfforts(setWireSpelling(efforts, level, event.target.value)) }}
            />
          </label>
        ))}
      </div>
      <div className={css.offGroup}>
        <span className={css.fieldLabel}>{t('offMode')}</span>
        {(['absent', 'empty', 'value'] as const).map((mode) => (
          <label key={mode} className={css.level}>
            <input
              type="radio"
              name={`off-${id}-${String(index)}`}
              checked={off.mode === mode}
              disabled={disabled}
              onChange={() => { patchEfforts(writeOff(efforts, mode, off.value)) }}
            />
            {mode === 'absent' ? t('offAbsent') : mode === 'empty' ? t('offEmpty') : t('offValue')}
          </label>
        ))}
        {off.mode === 'value'
          ? (
            <input
              className={`${css.input} ${css.wireInput}`}
              type="text"
              value={off.value}
              placeholder={t('offValuePlaceholder')}
              disabled={disabled}
              onChange={(event) => { patchEfforts(writeOff(efforts, 'value', event.target.value)) }}
            />
          )
          : null}
      </div>
      {err !== undefined ? <p className={css.error}>{err}</p> : null}
    </div>
  )
}

function RouteCard(props: {
  draft: RouteDraft
  formats: readonly string[]
  writable: boolean
  busy: boolean
  t: (key: EffortDeclareKey) => string
  onChange: (draft: RouteDraft) => void
  onSave: (draft: RouteDraft) => void
  onCancel: (draft: RouteDraft) => void
}): ReactNode {
  const { draft, formats, writable, busy, t, onChange } = props
  const disabled = !writable || busy
  const summary = compatSummary(draft.compat)
  const sameWire = draft.compat.supportsReasoningEffort === false
  const clientError = draft.models
    .map(row => errorText(modelEffortError(row), t))
    .find(text => text !== undefined)

  const applyPreset = (id: PresetId): void => {
    const preset = PRESETS[id]
    onChange({
      ...draft,
      models: applyPresetEfforts(draft.models, preset),
      compat: applyPresetCompat(draft.compat, preset),
    })
  }

  return (
    <li className={css.rowCard}>
      <div className={css.rowHead}>
        <span className={css.rowName}>{draft.displayName}</span>
        <span className={css.rowTag}>{draft.provider}</span>
      </div>
      <p className={css.compatSummary}>
        {t('compatSummary')}
        {summary === '' ? '' : `: ${summary}`}
      </p>
      <div className={css.presetRow}>
        <span className={css.fieldLabel}>{t('presets')}</span>
        <button type="button" className={css.secondaryButton} disabled={disabled} onClick={() => { applyPreset('deepseek') }}>
          {t('presetDeepSeek')}
        </button>
        <button type="button" className={css.secondaryButton} disabled={disabled} onClick={() => { applyPreset('openai') }}>
          {t('presetOpenAI')}
        </button>
        <button type="button" className={css.secondaryButton} disabled={disabled} onClick={() => { applyPreset('toggle') }}>
          {t('presetToggle')}
        </button>
      </div>
      {sameWire ? <p className={css.notice}>{t('presetToggleWarn')}</p> : null}
      {draft.models.length === 0 ? <p className={css.notice}>{t('noModels')}</p> : null}
      {draft.models.map((row, index) => (
        <ModelRowEditor
          key={`${String(row.id)}-${String(index)}`}
          row={row}
          index={index}
          disabled={disabled}
          t={t}
          onChange={(next) => {
            const models = draft.models.map((candidate, at) => at === index ? next : candidate)
            onChange({ ...draft, models })
          }}
        />
      ))}
      <details className={css.advanced}>
        <summary>{t('advanced')}</summary>
        <div className={css.advancedBody}>
          <label className={css.fieldLabel}>
            {t('thinkingFormat')}
            <select
              className={`${css.input} ${css.selectInput}`}
              value={typeof draft.compat.thinkingFormat === 'string' ? draft.compat.thinkingFormat : ''}
              disabled={disabled}
              onChange={(event) => {
                const compat = { ...draft.compat }
                if (event.target.value === '') delete compat.thinkingFormat
                else compat.thinkingFormat = event.target.value
                onChange({ ...draft, compat })
              }}
            >
              <option value="">{t('thinkingFormatDefault')}</option>
              {formats.map(format => <option key={format} value={format}>{format}</option>)}
            </select>
          </label>
          <label className={css.check}>
            <input
              type="checkbox"
              checked={draft.compat.supportsDeveloperRole === false}
              disabled={disabled}
              onChange={(event) => {
                const compat = { ...draft.compat }
                if (event.target.checked) compat.supportsDeveloperRole = false
                else delete compat.supportsDeveloperRole
                onChange({ ...draft, compat })
              }}
            />
            {t('supportsDeveloperRole')}
          </label>
          <label className={css.check}>
            <input
              type="checkbox"
              checked={draft.compat.supportsReasoningEffort === false}
              disabled={disabled}
              onChange={(event) => {
                const compat = { ...draft.compat }
                if (event.target.checked) compat.supportsReasoningEffort = false
                else delete compat.supportsReasoningEffort
                onChange({ ...draft, compat })
              }}
            />
            {t('supportsReasoningEffort')}
          </label>
        </div>
      </details>
      {clientError !== undefined ? <p className={css.error}>{clientError}</p> : null}
      <div className={css.actions}>
        <button
          type="button"
          className={css.secondaryButton}
          disabled={busy || !dirty(draft)}
          onClick={() => { props.onCancel(draft) }}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          className={css.primaryButton}
          disabled={disabled || !dirty(draft) || draft.models.length === 0 || clientError !== undefined}
          onClick={() => { props.onSave(draft) }}
        >
          {busy ? t('saving') : t('save')}
        </button>
      </div>
    </li>
  )
}

export function EffortDeclareSection(props: EffortDeclareSectionProps): ReactNode {
  const t = props.t
  const api = props.api
  const describe = props.describe
  const schema = props.schema
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [writable, setWritable] = useState(false)
  const [formats, setFormats] = useState<string[]>([...FALLBACK_THINKING_FORMATS])
  const [drafts, setDrafts] = useState<RouteDraft[]>([])
  const [busyRoute, setBusyRoute] = useState<string | null>(null)

  const reload = useCallback((): void => {
    if (api === undefined || describe === undefined || schema === undefined) {
      setStatus('error')
      setError(t('loadError'))
      return
    }
    setStatus('loading')
    setError('')
    void loadDrafts(api, describe, schema).then((result) => {
      setWritable(result.writable)
      setFormats(result.formats)
      setDrafts(result.drafts)
      if (result.error !== undefined) {
        setStatus('error')
        setError(result.error)
        return
      }
      setStatus('ready')
    }, (failure: unknown) => {
      setStatus('error')
      setError(failure instanceof Error ? failure.message : t('loadError'))
    })
  }, [api, describe, schema, t])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    if (props.onInvalidate === undefined) return undefined
    return props.onInvalidate(() => { reload() })
  }, [props.onInvalidate, reload])

  const save = async (draft: RouteDraft): Promise<void> => {
    if (api === undefined) return
    const blocking = draft.models
      .map(row => errorText(modelEffortError(row), t))
      .find(text => text !== undefined)
    if (blocking !== undefined) {
      setError(blocking)
      return
    }
    setBusyRoute(draft.provider)
    setError('')
    setNotice('')
    try {
      const ops = buildSaveOps({
        route: draft.provider,
        beforeModels: draft.originalModels,
        afterModels: draft.models,
        beforeCompat: draft.compatPresent ? draft.originalCompat : undefined,
        afterCompat: draft.compat,
      })
      if (ops.length === 0) {
        setBusyRoute(null)
        return
      }
      const response = await api.settings.mutate({
        ns: LLM_PI_AI_NS,
        ops,
        expectedRevision: draft.revision,
      })
      if (!response.result.ok) {
        setError(response.result.error.code === 'settings-conflict' ? t('conflict') : response.result.error.message)
        return
      }
      setNotice(t('saved'))
      reload()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('loadError'))
    } finally {
      setBusyRoute(null)
    }
  }

  return (
    <div className={css.section}>
      <h2 className={css.title}>{t('title')}</h2>
      <p className={css.intro}>{t('intro')}</p>
      {!writable && status === 'ready' ? <p className={css.notice}>{t('readOnly')}</p> : null}
      {error !== '' ? <p className={css.error}>{error}</p> : null}
      {notice !== '' ? <p className={css.savedNotice}>{notice}</p> : null}
      {status === 'error'
        ? (
          <button type="button" className={css.secondaryButton} onClick={reload}>{t('reload')}</button>
        )
        : null}
      {status === 'ready' && drafts.length === 0
        ? (
          <>
            <p className={css.notice}>{t('empty')}</p>
            <p className={css.intro}>{t('emptyHint')}</p>
          </>
        )
        : (
          <ul className={css.rows}>
            {drafts.map(draft => (
              <RouteCard
                key={draft.provider}
                draft={draft}
                formats={formats}
                writable={writable}
                busy={busyRoute === draft.provider}
                t={t}
                onChange={(next) => {
                  setDrafts(current => current.map(row => row.provider === next.provider ? next : row))
                }}
                onSave={(next) => { void save(next) }}
                onCancel={(next) => {
                  setDrafts(current => current.map(row => row.provider === next.provider
                    ? {
                        ...row,
                        models: cloneModels(row.originalModels),
                        compat: cloneObject(row.originalCompat),
                      }
                    : row))
                }}
              />
            ))}
          </ul>
        )}
    </div>
  )
}
