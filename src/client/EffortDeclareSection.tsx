/**
 * Settings section: per-model reasoningEfforts + openai-completions compat
 * for hand-declared llm-pi-ai routes.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsDescribeFace } from '@deepseek-ai/dsh-client-ui-settings/client'
import { LLM_PI_AI_NS, THINKING_LEVELS_WITHOUT_OFF } from '../core/catalog.ts'
import {
  alignDraft,
  applySaveSuccess,
  draftDirty,
  generationIsCurrent,
  mergeLoadedDrafts,
  nextGeneration,
  thinkingFormatChoices,
  type RouteDraft,
} from '../core/drafts.ts'
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
import { cloneModels, cloneObject } from '../core/paths.ts'
import { modelEffortError } from '../core/validate.ts'
import { loadDrafts } from './load-drafts.ts'
import { validateSaveDraft, type SchemaOps } from './schema-ops.ts'
import type { EffortDeclareKey } from './locales.ts'
import css from './effort-declare.module.css'

export type InvalidationSource = 'settings' | 'directory'

export interface EffortDeclareSectionInjected {
  api: Pick<IApiClient, 'settings' | 'llm'>
  describe: SettingsDescribeFace
  schema: SchemaOps
  subscribeInvalidate: (listener: (source: InvalidationSource) => void) => () => void
}

export interface EffortDeclareSectionProps extends Partial<EffortDeclareSectionInjected> {
  t: (key: EffortDeclareKey) => string
  close: () => void
}

export { loadDrafts } from './load-drafts.ts'

type CardNotice = { kind: 'saved' | 'conflict' | 'error'; text: string }

function compatSummary(compat: Record<string, unknown>): string {
  const parts: string[] = []
  if (typeof compat.thinkingFormat === 'string') parts.push(`thinkingFormat=${compat.thinkingFormat}`)
  if (compat.supportsDeveloperRole === false) parts.push('supportsDeveloperRole=false')
  if (compat.supportsReasoningEffort === false) parts.push('supportsReasoningEffort=false')
  return parts.join(' · ')
}

function errorText(code: ReturnType<typeof modelEffortError>, t: (key: EffortDeclareKey) => string): string | undefined {
  if (code === 'empty') return t('errorEmpty')
  if (code === 'off-only') return t('errorOffOnly')
  if (code === 'bad-wire') return t('errorBadWire')
  return undefined
}

function ModelRowEditor(props: {
  row: Record<string, unknown>
  index: number
  radioName: string
  disabled: boolean
  t: (key: EffortDeclareKey) => string
  onChange: (row: Record<string, unknown>) => void
}): ReactNode {
  const { row, disabled, t, onChange } = props
  const efforts = readEfforts(row) ?? {}
  const off = readOff(readEfforts(row))
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
              name={props.radioName}
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
    </div>
  )
}

function RouteCard(props: {
  draft: RouteDraft
  formats: readonly string[]
  writable: boolean
  busy: boolean
  reloading: boolean
  notice: CardNotice | undefined
  t: (key: EffortDeclareKey) => string
  onChange: (draft: RouteDraft) => void
  onSave: (draft: RouteDraft) => void
  onCancel: (draft: RouteDraft) => void
}): ReactNode {
  const { draft, writable, busy, reloading, t, onChange } = props
  const noModels = draft.models.length === 0
  const editDisabled = !writable || busy || noModels
  const saveLocked = editDisabled || reloading
  const formats = thinkingFormatChoices(props.formats, draft.compat.thinkingFormat)
  const summary = compatSummary(draft.compat)
  const sameWire = draft.compat.supportsReasoningEffort === false
  const clientError = draft.models
    .map(row => errorText(modelEffortError(row), t))
    .find(text => text !== undefined)
  const dirty = draftDirty(draft)

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
        <button type="button" className={css.secondaryButton} disabled={editDisabled} onClick={() => { applyPreset('deepseek') }}>
          {t('presetDeepSeek')}
        </button>
        <button type="button" className={css.secondaryButton} disabled={editDisabled} onClick={() => { applyPreset('openai') }}>
          {t('presetOpenAI')}
        </button>
        <button type="button" className={css.secondaryButton} disabled={editDisabled} onClick={() => { applyPreset('toggle') }}>
          {t('presetToggle')}
        </button>
      </div>
      {sameWire ? <p className={css.notice}>{t('presetToggleWarn')}</p> : null}
      {noModels ? <p className={css.notice}>{t('noModels')}</p> : null}
      {draft.models.map((row, index) => (
        <ModelRowEditor
          key={`${String(row.id)}-${String(index)}`}
          row={row}
          index={index}
          radioName={`off-${draft.provider}-${String(index)}`}
          disabled={editDisabled}
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
              disabled={editDisabled}
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
          {draft.compat.supportsDeveloperRole === true
            ? <p className={css.notice}>{t('developerTrueHint')}</p>
            : null}
          <label className={css.check}>
            <input
              type="checkbox"
              checked={draft.compat.supportsDeveloperRole === false}
              disabled={editDisabled}
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
              disabled={editDisabled}
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
      {props.notice?.kind === 'saved' ? <p className={css.savedNotice}>{props.notice.text}</p> : null}
      {props.notice?.kind === 'conflict' || props.notice?.kind === 'error'
        ? <p className={css.error}>{props.notice.text}</p>
        : null}
      <div className={css.actions}>
        <button
          type="button"
          className={css.secondaryButton}
          disabled={busy || !dirty}
          onClick={() => { props.onCancel(draft) }}
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          className={css.primaryButton}
          disabled={saveLocked || !dirty || clientError !== undefined}
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
  const [writable, setWritable] = useState(false)
  const [formats, setFormats] = useState<string[]>([])
  const [drafts, setDrafts] = useState<RouteDraft[]>([])
  const [busyRoute, setBusyRoute] = useState<string | null>(null)
  const [notices, setNotices] = useState<Record<string, CardNotice>>({})
  const generationRef = useRef(0)
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts

  const reload = useCallback((preserveDirty: boolean): void => {
    if (api === undefined || describe === undefined || schema === undefined) {
      setStatus('error')
      setError(t('loadError'))
      return
    }
    const generation = nextGeneration(generationRef)
    setStatus('loading')
    setError('')
    void loadDrafts(api, describe, schema).then((result) => {
      if (!generationIsCurrent(generationRef, generation)) return
      setWritable(result.writable)
      setFormats(result.formats)
      if (result.error !== undefined) {
        setStatus('error')
        setError(result.error)
        return
      }
      const merged = mergeLoadedDrafts(draftsRef.current, result.drafts, { preserveDirty })
      setDrafts(merged.drafts)
      if (merged.conflicted.length > 0) {
        setNotices(current => {
          const next = { ...current }
          for (const provider of merged.conflicted) {
            next[provider] = { kind: 'conflict', text: t('dirtyConflict') }
          }
          return next
        })
      }
      setStatus('ready')
    }, (failure: unknown) => {
      if (!generationIsCurrent(generationRef, generation)) return
      setStatus('error')
      setError(failure instanceof Error ? failure.message : t('loadError'))
    })
  }, [api, describe, schema, t])

  useEffect(() => { reload(false) }, [reload])

  useEffect(() => {
    if (props.subscribeInvalidate === undefined) return undefined
    return props.subscribeInvalidate((source) => {
      if (source === 'settings' || source === 'directory') reload(true)
    })
  }, [props.subscribeInvalidate, reload])

  const patchNotice = (provider: string, notice: CardNotice | undefined): void => {
    setNotices(current => {
      const copy = { ...current }
      if (notice === undefined) delete copy[provider]
      else copy[provider] = notice
      return copy
    })
  }

  const save = async (draft: RouteDraft): Promise<void> => {
    if (api === undefined || describe === undefined || schema === undefined) return
    if (status === 'loading' || busyRoute !== null) return
    const blocking = draft.models
      .map(row => errorText(modelEffortError(row), t))
      .find(text => text !== undefined)
    if (blocking !== undefined) {
      patchNotice(draft.provider, { kind: 'error', text: blocking })
      return
    }
    setBusyRoute(draft.provider)
    patchNotice(draft.provider, undefined)
    try {
      const ops = buildSaveOps({
        settingsPath: draft.settingsPath,
        beforeModels: draft.originalModels,
        afterModels: draft.models,
        beforeCompat: draft.compatPresent ? draft.originalCompat : undefined,
        afterCompat: draft.compat,
      })
      if (ops.length === 0) {
        setDrafts(current => current.map(row => row.provider === draft.provider ? alignDraft(row) : row))
        return
      }
      const willWriteCompat = ops.some(op => (
        op.path.length > draft.settingsPath.length && op.path[draft.settingsPath.length] === 'compat'
      ))
      const pi = describe.getSnapshot().view?.namespaces.find(view => view.ns === LLM_PI_AI_NS)
      if (pi !== undefined) {
        let root: unknown
        try {
          root = schema.rehydrate(pi.schema)
        } catch {
          root = undefined
        }
        if (root !== undefined) {
          const schemaError = validateSaveDraft(
            schema,
            root,
            draft.settingsPath,
            draft.models,
            draft.compat,
            willWriteCompat,
          )
          if (schemaError !== undefined) {
            patchNotice(draft.provider, { kind: 'error', text: schemaError })
            return
          }
        }
      }
      const response = await api.settings.mutate({
        ns: LLM_PI_AI_NS,
        ops,
        expectedRevision: draft.revision,
      })
      if (!response.result.ok) {
        const conflict = response.result.error.code === 'settings-conflict'
        patchNotice(draft.provider, {
          kind: conflict ? 'conflict' : 'error',
          text: conflict ? t('conflict') : response.result.error.message,
        })
        if (conflict) reload(true)
        return
      }
      const view = response.result.value
      describe.acceptView(view)
      setDrafts(current => applySaveSuccess(current, draft.provider, {
        user: view.user ?? {},
        revision: view.revision,
      }))
      patchNotice(draft.provider, { kind: 'saved', text: t('saved') })
    } catch (failure) {
      patchNotice(draft.provider, {
        kind: 'error',
        text: failure instanceof Error ? failure.message : t('loadError'),
      })
    } finally {
      setBusyRoute(null)
    }
  }

  const showLoading = status === 'loading' && drafts.length === 0
  const showEmpty = status === 'ready' && drafts.length === 0
  const showList = drafts.length > 0
  const hasCardFailure = Object.values(notices).some(
    notice => notice.kind === 'conflict' || notice.kind === 'error',
  )
  const showReload = status === 'error' || hasCardFailure || showEmpty || !writable || status === 'loading' || showList

  return (
    <div className={css.section}>
      <h2 className={css.title}>{t('title')}</h2>
      <p className={css.intro}>{t('intro')}</p>
      {!writable && status === 'ready' ? <p className={css.notice}>{t('readOnly')}</p> : null}
      {showLoading ? <p className={css.intro}>{t('loading')}</p> : null}
      {status === 'error' ? <p className={css.error}>{error}</p> : null}
      {showReload
        ? (
          <button type="button" className={css.secondaryButton} onClick={() => { reload(true) }}>{t('reload')}</button>
        )
        : null}
      {showEmpty
        ? (
          <>
            <p className={css.notice}>{t('empty')}</p>
            <p className={css.intro}>{t('emptyHint')}</p>
          </>
        )
        : null}
      {showList
        ? (
          <ul className={css.rows}>
            {drafts.map(draft => (
              <RouteCard
                key={draft.provider}
                draft={draft}
                formats={formats.length > 0 ? formats : []}
                writable={writable}
                busy={busyRoute === draft.provider}
                reloading={status === 'loading'}
                notice={notices[draft.provider]}
                t={t}
                onChange={(next) => {
                  patchNotice(next.provider, undefined)
                  setDrafts(current => current.map(row => row.provider === next.provider ? next : row))
                }}
                onSave={(next) => { void save(next) }}
                onCancel={(next) => {
                  patchNotice(next.provider, undefined)
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
        )
        : null}
    </div>
  )
}
