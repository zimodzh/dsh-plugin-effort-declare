import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Settings section: per-model reasoningEfforts, image input, and
 * openai-completions compat for hand-declared llm-pi-ai routes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { LLM_PI_AI_NS, THINKING_LEVELS_WITHOUT_OFF } from "../core/catalog.js";
import { alignDraft, applySaveSuccess, draftDirty, generationIsCurrent, mergeLoadedDrafts, nextGeneration, thinkingFormatChoices, } from "../core/drafts.js";
import { hasLevel, readEfforts, readOff, setWireSpelling, toggleLevel, writeEfforts, writeOff, clearReasoningEfforts, } from "../core/efforts.js";
import { applyPresetCompat, applyPresetEfforts, PRESETS } from "../core/presets.js";
import { buildSaveOps } from "../core/path-ops.js";
import { cloneModels, cloneObject } from "../core/paths.js";
import { readImageCapable, writeImageCapable } from "../core/input.js";
import { modelRowError } from "../core/validate.js";
import { PLUGIN_FOOTER_TEXT } from "./build-info.js";
import { foldReloadNotices, isOwnDocumentEcho, loadDrafts, waitForNamespaceRevision, waitForNamespaceRevisionChange, } from "./load-drafts.js";
import { validateSaveDraft } from "./schema-ops.js";
import css from './effort-declare.module.css';
export { loadDrafts } from "./load-drafts.js";
function compatSummary(compat) {
    const parts = [];
    if (typeof compat.thinkingFormat === 'string')
        parts.push(`thinkingFormat=${compat.thinkingFormat}`);
    if (compat.supportsDeveloperRole === false)
        parts.push('supportsDeveloperRole=false');
    if (compat.supportsReasoningEffort === false)
        parts.push('supportsReasoningEffort=false');
    return parts.join(' · ');
}
function errorText(code, t) {
    if (code === 'empty')
        return t('errorEmpty');
    if (code === 'off-only')
        return t('errorOffOnly');
    if (code === 'bad-wire')
        return t('errorBadWire');
    if (code === 'bad-input')
        return t('errorBadInput');
    return undefined;
}
function ModelRowEditor(props) {
    const { row, disabled, t, onChange } = props;
    const efforts = readEfforts(row) ?? {};
    const off = readOff(readEfforts(row));
    const id = typeof row.id === 'string' ? row.id : '';
    const name = typeof row.name === 'string' ? row.name : '';
    const patchEfforts = (next) => {
        onChange(writeEfforts(row, Object.keys(next).length === 0 ? undefined : next));
    };
    return (_jsxs("div", { className: css.modelEntry, children: [_jsxs("div", { className: css.modelHead, children: [_jsx("span", { className: css.modelId, children: id || t('model') }), name !== '' && name !== id ? _jsx("span", { className: css.modelName, children: name }) : null, _jsx("button", { type: "button", className: css.linkButton, disabled: disabled || !('reasoningEfforts' in row), onClick: () => { onChange(clearReasoningEfforts(row)); }, children: t('clear') })] }), _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: readImageCapable(row), disabled: disabled, onChange: (event) => { onChange(writeImageCapable(row, event.target.checked)); } }), t('imageInput')] }), readImageCapable(row) ? _jsx("p", { className: css.notice, children: t('imageInputHint') }) : null, _jsx("span", { className: css.fieldLabel, children: t('levels') }), _jsx("div", { className: css.levels, children: THINKING_LEVELS_WITHOUT_OFF.map((level) => (_jsxs("label", { className: css.level, children: [_jsx("input", { type: "checkbox", checked: hasLevel(efforts, level), disabled: disabled, onChange: (event) => { patchEfforts(toggleLevel(efforts, level, event.target.checked)); } }), level] }, level))) }), _jsxs("div", { className: css.wireRow, children: [_jsx("span", { className: css.fieldLabel, children: t('wire') }), THINKING_LEVELS_WITHOUT_OFF.filter(level => hasLevel(efforts, level)).map((level) => (_jsxs("label", { className: css.level, children: [level, _jsx("input", { className: `${css.input} ${css.wireInput}`, type: "text", value: efforts[level] ?? level, disabled: disabled, "aria-label": `${t('wire')} ${level}`, onChange: (event) => { patchEfforts(setWireSpelling(efforts, level, event.target.value)); } })] }, level)))] }), _jsxs("div", { className: css.offGroup, children: [_jsx("span", { className: css.fieldLabel, children: t('offMode') }), ['absent', 'empty', 'value'].map((mode) => (_jsxs("label", { className: css.level, children: [_jsx("input", { type: "radio", name: props.radioName, checked: off.mode === mode, disabled: disabled, onChange: () => { patchEfforts(writeOff(efforts, mode, off.value)); } }), mode === 'absent' ? t('offAbsent') : mode === 'empty' ? t('offEmpty') : t('offValue')] }, mode))), off.mode === 'value'
                        ? (_jsx("input", { className: `${css.input} ${css.wireInput}`, type: "text", value: off.value, placeholder: t('offValuePlaceholder'), disabled: disabled, onChange: (event) => { patchEfforts(writeOff(efforts, 'value', event.target.value)); } }))
                        : null] })] }));
}
function RouteCard(props) {
    const { draft, writable, busy, saveLocked, t, onChange } = props;
    const noModels = draft.models.length === 0;
    const editDisabled = !writable || busy || noModels;
    const saveDisabled = saveLocked || noModels;
    const formats = thinkingFormatChoices(props.formats, draft.compat.thinkingFormat);
    const summary = compatSummary(draft.compat);
    const sameWire = draft.compat.supportsReasoningEffort === false;
    const clientError = draft.models
        .map(row => errorText(modelRowError(row), t))
        .find(text => text !== undefined);
    const dirty = draftDirty(draft);
    const applyPreset = (id) => {
        const preset = PRESETS[id];
        onChange({
            ...draft,
            models: applyPresetEfforts(draft.models, preset),
            compat: applyPresetCompat(draft.compat, preset),
        });
    };
    return (_jsxs("li", { className: css.rowCard, children: [_jsxs("div", { className: css.rowHead, children: [_jsx("span", { className: css.rowName, children: draft.displayName }), _jsx("span", { className: css.rowTag, children: draft.provider })] }), _jsxs("p", { className: css.compatSummary, children: [t('compatSummary'), summary === '' ? '' : `: ${summary}`] }), _jsxs("div", { className: css.presetRow, children: [_jsx("span", { className: css.fieldLabel, children: t('presets') }), _jsx("button", { type: "button", className: css.secondaryButton, disabled: editDisabled, onClick: () => { applyPreset('deepseek'); }, children: t('presetDeepSeek') }), _jsx("button", { type: "button", className: css.secondaryButton, disabled: editDisabled, onClick: () => { applyPreset('openai'); }, children: t('presetOpenAI') }), _jsx("button", { type: "button", className: css.secondaryButton, disabled: editDisabled, onClick: () => { applyPreset('toggle'); }, children: t('presetToggle') })] }), sameWire ? _jsx("p", { className: css.notice, children: t('presetToggleWarn') }) : null, noModels ? _jsx("p", { className: css.notice, children: t('noModels') }) : null, draft.models.map((row, index) => (_jsx(ModelRowEditor, { row: row, index: index, radioName: `off-${draft.provider}-${String(index)}`, disabled: editDisabled, t: t, onChange: (next) => {
                    const models = draft.models.map((candidate, at) => at === index ? next : candidate);
                    onChange({ ...draft, models });
                } }, `${String(row.id)}-${String(index)}`))), _jsxs("details", { className: css.advanced, children: [_jsx("summary", { children: t('advanced') }), _jsxs("div", { className: css.advancedBody, children: [_jsxs("label", { className: css.fieldLabel, children: [t('thinkingFormat'), _jsxs("select", { className: `${css.input} ${css.selectInput}`, value: typeof draft.compat.thinkingFormat === 'string' ? draft.compat.thinkingFormat : '', disabled: editDisabled, onChange: (event) => {
                                            const compat = { ...draft.compat };
                                            if (event.target.value === '')
                                                delete compat.thinkingFormat;
                                            else
                                                compat.thinkingFormat = event.target.value;
                                            onChange({ ...draft, compat });
                                        }, children: [_jsx("option", { value: "", children: t('thinkingFormatDefault') }), formats.map(format => _jsx("option", { value: format, children: format }, format))] })] }), draft.compat.supportsDeveloperRole === true
                                ? _jsx("p", { className: css.notice, children: t('developerTrueHint') })
                                : null, _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: draft.compat.supportsDeveloperRole === false, disabled: editDisabled, onChange: (event) => {
                                            const compat = { ...draft.compat };
                                            if (event.target.checked)
                                                compat.supportsDeveloperRole = false;
                                            else
                                                delete compat.supportsDeveloperRole;
                                            onChange({ ...draft, compat });
                                        } }), t('supportsDeveloperRole')] }), _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: draft.compat.supportsReasoningEffort === false, disabled: editDisabled, onChange: (event) => {
                                            const compat = { ...draft.compat };
                                            if (event.target.checked)
                                                compat.supportsReasoningEffort = false;
                                            else
                                                delete compat.supportsReasoningEffort;
                                            onChange({ ...draft, compat });
                                        } }), t('supportsReasoningEffort')] })] })] }), clientError !== undefined ? _jsx("p", { className: css.error, children: clientError }) : null, props.notice?.kind === 'saved' ? _jsx("p", { className: css.savedNotice, children: props.notice.text }) : null, props.notice?.kind === 'conflict' || props.notice?.kind === 'error'
                ? _jsx("p", { className: css.error, children: props.notice.text })
                : null, _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.secondaryButton, disabled: busy || !dirty, onClick: () => { props.onCancel(draft); }, children: t('cancel') }), _jsx("button", { type: "button", className: css.primaryButton, disabled: saveDisabled || !dirty || clientError !== undefined, onClick: () => { props.onSave(draft); }, children: busy ? t('saving') : t('save') })] })] }));
}
export function EffortDeclareSection(props) {
    const t = props.t;
    const api = props.api;
    const describe = props.describe;
    const schema = props.schema;
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [writable, setWritable] = useState(false);
    const [formats, setFormats] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [busyRoute, setBusyRoute] = useState(null);
    const [notices, setNotices] = useState({});
    const generationRef = useRef(0);
    const draftsRef = useRef(drafts);
    const echoedRevisionRef = useRef(undefined);
    const pendingRevisionRef = useRef(undefined);
    const busyRouteRef = useRef(null);
    const abortRef = useRef(null);
    draftsRef.current = drafts;
    const applyDrafts = (next) => {
        const resolved = typeof next === 'function' ? next(draftsRef.current) : next;
        draftsRef.current = resolved;
        setDrafts(resolved);
    };
    const snapshotMode = () => (describe === undefined || describe.getSnapshot().status === 'idle' ? 'ensure' : 'snapshot');
    const beginGeneration = () => {
        abortRef.current?.abort();
        const abort = new AbortController();
        abortRef.current = abort;
        return { generation: nextGeneration(generationRef), signal: abort.signal };
    };
    const failGeneration = (generation, failure) => {
        if (!generationIsCurrent(generationRef, generation))
            return;
        setStatus('error');
        setError(failure instanceof Error ? failure.message : t('loadError'));
    };
    const settleReload = (generation, preserveDirty, result) => {
        if (!generationIsCurrent(generationRef, generation))
            return;
        setWritable(result.writable);
        setFormats(result.formats);
        if (result.error !== undefined) {
            setStatus('error');
            setError(result.error);
            return;
        }
        const merged = mergeLoadedDrafts(draftsRef.current, result.drafts, { preserveDirty });
        applyDrafts(merged.drafts);
        setNotices(current => foldReloadNotices(current, {
            conflicted: merged.conflicted,
            conflictNotice: { kind: 'conflict', text: t('dirtyConflict') },
            liveProviders: merged.drafts.map(draft => draft.provider),
        }));
        setStatus('ready');
    };
    const loadSnapshotThenSettle = async (generation, preserveDirty) => {
        if (api === undefined || describe === undefined || schema === undefined)
            return;
        if (!generationIsCurrent(generationRef, generation))
            return;
        try {
            const result = await loadDrafts(api, describe, schema, 'snapshot');
            settleReload(generation, preserveDirty, result);
        }
        catch (failure) {
            failGeneration(generation, failure);
        }
    };
    const reload = useCallback((preserveDirty, mode = 'ensure') => {
        if (api === undefined || describe === undefined || schema === undefined) {
            setStatus('error');
            setError(t('loadError'));
            return;
        }
        const { generation } = beginGeneration();
        if (draftsRef.current.length === 0)
            setStatus('loading');
        setError('');
        void loadDrafts(api, describe, schema, mode).then((result) => {
            settleReload(generation, preserveDirty, result);
        }, (failure) => {
            failGeneration(generation, failure);
        });
    }, [api, describe, schema, t]);
    const refreshAtRevision = useCallback((revision, preserveDirty) => {
        if (api === undefined || describe === undefined || schema === undefined)
            return;
        const { generation, signal } = beginGeneration();
        if (draftsRef.current.length === 0)
            setStatus('loading');
        setError('');
        void waitForNamespaceRevision(describe, LLM_PI_AI_NS, revision, signal).then((outcome) => {
            if (outcome === 'aborted' || !generationIsCurrent(generationRef, generation))
                return;
            return loadSnapshotThenSettle(generation, preserveDirty);
        }, (failure) => {
            failGeneration(generation, failure);
        });
    }, [api, describe, schema, t]);
    const flushPendingSettings = (refresh) => {
        const pending = pendingRevisionRef.current;
        pendingRevisionRef.current = undefined;
        if (pending === undefined)
            return;
        if (isOwnDocumentEcho(echoedRevisionRef.current, pending))
            return;
        refresh(pending, true);
    };
    useEffect(() => { reload(false, 'ensure'); }, [reload]);
    useEffect(() => () => {
        abortRef.current?.abort();
        nextGeneration(generationRef);
    }, []);
    useEffect(() => {
        if (props.subscribeInvalidate === undefined)
            return undefined;
        return props.subscribeInvalidate((event) => {
            if (event.source === 'writable') {
                const view = describe?.getSnapshot().view;
                if (view !== undefined)
                    setWritable(view.writable);
                return;
            }
            if (event.source === 'settings') {
                if (busyRouteRef.current !== null) {
                    pendingRevisionRef.current = event.revision;
                    return;
                }
                if (isOwnDocumentEcho(echoedRevisionRef.current, event.revision))
                    return;
                refreshAtRevision(event.revision, true);
                return;
            }
            if (event.source === 'directory')
                reload(true, snapshotMode());
            if (event.source === 'reset')
                reload(true, 'ensure');
        });
    }, [describe, props.subscribeInvalidate, refreshAtRevision, reload]);
    const patchNotice = (provider, notice) => {
        setNotices(current => {
            const copy = { ...current };
            if (notice === undefined)
                delete copy[provider];
            else
                copy[provider] = notice;
            return copy;
        });
    };
    const save = async (draft) => {
        if (api === undefined || describe === undefined || schema === undefined)
            return;
        if (status === 'loading' || busyRouteRef.current !== null) {
            patchNotice(draft.provider, { kind: 'error', text: t('saveBusy') });
            return;
        }
        const blocking = draft.models
            .map(row => errorText(modelRowError(row), t))
            .find(text => text !== undefined);
        if (blocking !== undefined) {
            patchNotice(draft.provider, { kind: 'error', text: blocking });
            return;
        }
        busyRouteRef.current = draft.provider;
        setBusyRoute(draft.provider);
        patchNotice(draft.provider, undefined);
        try {
            const ops = buildSaveOps({
                settingsPath: draft.settingsPath,
                beforeModels: draft.originalModels,
                afterModels: draft.models,
                beforeCompat: draft.compatPresent ? draft.originalCompat : undefined,
                afterCompat: draft.compat,
            });
            if (ops.length === 0) {
                applyDrafts(current => current.map(row => row.provider === draft.provider ? alignDraft(row) : row));
                return;
            }
            const willWriteCompat = ops.some(op => (op.path.length > draft.settingsPath.length && op.path[draft.settingsPath.length] === 'compat'));
            const pi = describe.getSnapshot().view?.namespaces.find(view => view.ns === LLM_PI_AI_NS);
            if (pi !== undefined) {
                let root;
                try {
                    root = schema.rehydrate(pi.schema);
                }
                catch {
                    root = undefined;
                }
                if (root !== undefined) {
                    const schemaError = validateSaveDraft(schema, root, draft.settingsPath, draft.models, draft.compat, willWriteCompat);
                    if (schemaError !== undefined) {
                        patchNotice(draft.provider, { kind: 'error', text: schemaError });
                        return;
                    }
                }
            }
            const response = await api.settings.mutate({
                ns: LLM_PI_AI_NS,
                ops,
                expectedRevision: draft.revision,
            });
            if (!response.result.ok) {
                const conflict = response.result.error.code === 'settings-conflict';
                patchNotice(draft.provider, {
                    kind: conflict ? 'conflict' : 'error',
                    text: conflict ? t('conflict') : response.result.error.message,
                });
                if (conflict) {
                    const { generation, signal } = beginGeneration();
                    void waitForNamespaceRevisionChange(describe, LLM_PI_AI_NS, draft.revision, signal).then((outcome) => {
                        if (outcome === 'aborted' || !generationIsCurrent(generationRef, generation))
                            return;
                        return loadSnapshotThenSettle(generation, true);
                    }, (failure) => {
                        failGeneration(generation, failure);
                    });
                }
                return;
            }
            const view = response.result.value;
            echoedRevisionRef.current = view.revision;
            describe.acceptView(view);
            applyDrafts(applySaveSuccess(draftsRef.current, draft.provider, {
                user: view.user ?? {},
                revision: view.revision,
            }));
            patchNotice(draft.provider, { kind: 'saved', text: t('saved') });
        }
        catch (failure) {
            patchNotice(draft.provider, {
                kind: 'error',
                text: failure instanceof Error ? failure.message : t('loadError'),
            });
        }
        finally {
            busyRouteRef.current = null;
            setBusyRoute(null);
            flushPendingSettings(refreshAtRevision);
        }
    };
    const showLoading = status === 'loading' && drafts.length === 0;
    const showEmpty = status === 'ready' && drafts.length === 0;
    const showList = drafts.length > 0;
    const hasCardFailure = Object.values(notices).some(notice => notice.kind === 'conflict' || notice.kind === 'error');
    const showReload = status === 'error' || hasCardFailure || showEmpty || !writable || status === 'loading' || showList;
    return (_jsxs("div", { className: css.section, children: [_jsx("h2", { className: css.title, children: t('title') }), _jsx("p", { className: css.intro, children: t('intro') }), !writable && status === 'ready' ? _jsx("p", { className: css.notice, children: t('readOnly') }) : null, showLoading ? _jsx("p", { className: css.intro, children: t('loading') }) : null, status === 'error' ? _jsx("p", { className: css.error, children: error }) : null, showReload
                ? (_jsx("button", { type: "button", className: css.secondaryButton, onClick: () => { reload(true, snapshotMode()); }, children: t('reload') }))
                : null, showEmpty
                ? (_jsxs(_Fragment, { children: [_jsx("p", { className: css.notice, children: t('empty') }), _jsx("p", { className: css.intro, children: t('emptyHint') })] }))
                : null, showList
                ? (_jsx("ul", { className: css.rows, children: drafts.map(draft => (_jsx(RouteCard, { draft: draft, formats: formats.length > 0 ? formats : [], writable: writable, busy: busyRoute === draft.provider, saveLocked: !writable || busyRoute !== null || status === 'loading', notice: notices[draft.provider], t: t, onChange: (next) => {
                            patchNotice(next.provider, undefined);
                            applyDrafts(current => current.map(row => row.provider === next.provider ? next : row));
                        }, onSave: (next) => { void save(next); }, onCancel: (next) => {
                            patchNotice(next.provider, undefined);
                            applyDrafts(current => current.map(row => row.provider === next.provider
                                ? {
                                    ...row,
                                    models: cloneModels(row.originalModels),
                                    compat: cloneObject(row.originalCompat),
                                }
                                : row));
                        } }, draft.provider))) }))
                : null, _jsx("p", { className: css.footer, children: PLUGIN_FOOTER_TEXT })] }));
}
