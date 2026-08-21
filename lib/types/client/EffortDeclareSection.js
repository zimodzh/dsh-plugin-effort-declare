import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Settings section: per-model reasoningEfforts + openai-completions compat
 * for hand-declared llm-pi-ai routes.
 */
import { useCallback, useEffect, useState } from 'react';
import { FALLBACK_THINKING_FORMATS, LLM_PI_AI_NS, SCHEMA_PROBE_ROUTE, THINKING_LEVELS_WITHOUT_OFF, } from "../core/catalog.js";
import { classifyRoute, profileAt, unionStringChoices } from "../core/filter.js";
import { hasLevel, readEfforts, readOff, setWireSpelling, toggleLevel, writeEfforts, writeOff, clearReasoningEfforts, } from "../core/efforts.js";
import { applyPresetCompat, applyPresetEfforts, PRESETS } from "../core/presets.js";
import { buildSaveOps } from "../core/path-ops.js";
import { cloneModels, cloneObject, isPlainObject } from "../core/paths.js";
import { modelEffortError } from "../core/validate.js";
import css from './effort-declare.module.css';
function schemaDefaultString(node) {
    if (!isPlainObject(node) || !isPlainObject(node.meta))
        return undefined;
    return typeof node.meta.default === 'string' ? node.meta.default : undefined;
}
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
function dirty(draft) {
    return JSON.stringify(draft.models) !== JSON.stringify(draft.originalModels)
        || JSON.stringify(draft.compat) !== JSON.stringify(draft.originalCompat);
}
function errorText(code, t) {
    if (code === 'empty')
        return t('errorEmpty');
    if (code === 'off-only')
        return t('errorOffOnly');
    if (code === 'bad-wire')
        return t('errorBadWire');
    return undefined;
}
/**
 * Load editable route drafts from llm.providers + the llm-pi-ai namespace.
 */
export async function loadDrafts(api, describe, schema) {
    await describe.ensure();
    const mirrored = describe.getSnapshot();
    if (mirrored.view === undefined) {
        return { writable: false, formats: [...FALLBACK_THINKING_FORMATS], drafts: [], error: mirrored.error ?? undefined };
    }
    const providersResponse = await api.llm.providers({});
    if (!providersResponse.result.ok) {
        return {
            writable: mirrored.view.writable,
            formats: [...FALLBACK_THINKING_FORMATS],
            drafts: [],
            error: providersResponse.result.error.message,
        };
    }
    const namespaces = new Map(mirrored.view.namespaces.map((view) => [view.ns, view]));
    const pi = namespaces.get(LLM_PI_AI_NS);
    let formats = [...FALLBACK_THINKING_FORMATS];
    let schemaDefaultApi;
    if (pi !== undefined) {
        try {
            const root = schema.rehydrate(pi.schema);
            const formatNode = schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'compat', 'thinkingFormat']);
            const fromSchema = unionStringChoices(formatNode);
            if (fromSchema.length > 0)
                formats = fromSchema;
            schemaDefaultApi = schemaDefaultString(schema.nodeAtPath(root, ['providers', SCHEMA_PROBE_ROUTE, 'api']));
        }
        catch {
            // Live schema walk is best-effort; fallback list is test-pinned.
        }
    }
    const drafts = [];
    for (const entry of providersResponse.result.value.providers) {
        const profile = profileAt(pi?.value, entry.settingsPath, entry.provider);
        if (!classifyRoute(entry, profile, schemaDefaultApi).editable)
            continue;
        const models = cloneModels(isPlainObject(profile) ? profile.models : []);
        const compatPresent = isPlainObject(profile) && isPlainObject(profile.compat);
        const compat = cloneObject(isPlainObject(profile) ? profile.compat : {});
        drafts.push({
            provider: entry.provider,
            displayName: entry.displayName,
            revision: pi?.revision ?? 0,
            models,
            originalModels: cloneModels(models),
            compat,
            originalCompat: cloneObject(compat),
            compatPresent,
        });
    }
    return { writable: mirrored.view.writable, formats, drafts };
}
function ModelRowEditor(props) {
    const { row, index, disabled, t, onChange } = props;
    const efforts = readEfforts(row) ?? {};
    const off = readOff(readEfforts(row));
    const err = errorText(modelEffortError(row), t);
    const id = typeof row.id === 'string' ? row.id : '';
    const name = typeof row.name === 'string' ? row.name : '';
    const patchEfforts = (next) => {
        onChange(writeEfforts(row, Object.keys(next).length === 0 ? undefined : next));
    };
    return (_jsxs("div", { className: css.modelEntry, children: [_jsxs("div", { className: css.modelHead, children: [_jsx("span", { className: css.modelId, children: id || t('model') }), name !== '' && name !== id ? _jsx("span", { className: css.modelName, children: name }) : null, _jsx("button", { type: "button", className: css.linkButton, disabled: disabled || !('reasoningEfforts' in row), onClick: () => { onChange(clearReasoningEfforts(row)); }, children: t('clear') })] }), _jsx("span", { className: css.fieldLabel, children: t('levels') }), _jsx("div", { className: css.levels, children: THINKING_LEVELS_WITHOUT_OFF.map((level) => (_jsxs("label", { className: css.level, children: [_jsx("input", { type: "checkbox", checked: hasLevel(efforts, level), disabled: disabled, onChange: (event) => { patchEfforts(toggleLevel(efforts, level, event.target.checked)); } }), level] }, level))) }), _jsxs("div", { className: css.wireRow, children: [_jsx("span", { className: css.fieldLabel, children: t('wire') }), THINKING_LEVELS_WITHOUT_OFF.filter(level => hasLevel(efforts, level)).map((level) => (_jsxs("label", { className: css.level, children: [level, _jsx("input", { className: `${css.input} ${css.wireInput}`, type: "text", value: efforts[level] ?? level, disabled: disabled, "aria-label": `${t('wire')} ${level}`, onChange: (event) => { patchEfforts(setWireSpelling(efforts, level, event.target.value)); } })] }, level)))] }), _jsxs("div", { className: css.offGroup, children: [_jsx("span", { className: css.fieldLabel, children: t('offMode') }), ['absent', 'empty', 'value'].map((mode) => (_jsxs("label", { className: css.level, children: [_jsx("input", { type: "radio", name: `off-${id}-${String(index)}`, checked: off.mode === mode, disabled: disabled, onChange: () => { patchEfforts(writeOff(efforts, mode, off.value)); } }), mode === 'absent' ? t('offAbsent') : mode === 'empty' ? t('offEmpty') : t('offValue')] }, mode))), off.mode === 'value'
                        ? (_jsx("input", { className: `${css.input} ${css.wireInput}`, type: "text", value: off.value, placeholder: t('offValuePlaceholder'), disabled: disabled, onChange: (event) => { patchEfforts(writeOff(efforts, 'value', event.target.value)); } }))
                        : null] }), err !== undefined ? _jsx("p", { className: css.error, children: err }) : null] }));
}
function RouteCard(props) {
    const { draft, formats, writable, busy, t, onChange } = props;
    const disabled = !writable || busy;
    const summary = compatSummary(draft.compat);
    const sameWire = draft.compat.supportsReasoningEffort === false;
    const clientError = draft.models
        .map(row => errorText(modelEffortError(row), t))
        .find(text => text !== undefined);
    const applyPreset = (id) => {
        const preset = PRESETS[id];
        onChange({
            ...draft,
            models: applyPresetEfforts(draft.models, preset),
            compat: applyPresetCompat(draft.compat, preset),
        });
    };
    return (_jsxs("li", { className: css.rowCard, children: [_jsxs("div", { className: css.rowHead, children: [_jsx("span", { className: css.rowName, children: draft.displayName }), _jsx("span", { className: css.rowTag, children: draft.provider })] }), _jsxs("p", { className: css.compatSummary, children: [t('compatSummary'), summary === '' ? '' : `: ${summary}`] }), _jsxs("div", { className: css.presetRow, children: [_jsx("span", { className: css.fieldLabel, children: t('presets') }), _jsx("button", { type: "button", className: css.secondaryButton, disabled: disabled, onClick: () => { applyPreset('deepseek'); }, children: t('presetDeepSeek') }), _jsx("button", { type: "button", className: css.secondaryButton, disabled: disabled, onClick: () => { applyPreset('openai'); }, children: t('presetOpenAI') }), _jsx("button", { type: "button", className: css.secondaryButton, disabled: disabled, onClick: () => { applyPreset('toggle'); }, children: t('presetToggle') })] }), sameWire ? _jsx("p", { className: css.notice, children: t('presetToggleWarn') }) : null, draft.models.length === 0 ? _jsx("p", { className: css.notice, children: t('noModels') }) : null, draft.models.map((row, index) => (_jsx(ModelRowEditor, { row: row, index: index, disabled: disabled, t: t, onChange: (next) => {
                    const models = draft.models.map((candidate, at) => at === index ? next : candidate);
                    onChange({ ...draft, models });
                } }, `${String(row.id)}-${String(index)}`))), _jsxs("details", { className: css.advanced, children: [_jsx("summary", { children: t('advanced') }), _jsxs("div", { className: css.advancedBody, children: [_jsxs("label", { className: css.fieldLabel, children: [t('thinkingFormat'), _jsxs("select", { className: `${css.input} ${css.selectInput}`, value: typeof draft.compat.thinkingFormat === 'string' ? draft.compat.thinkingFormat : '', disabled: disabled, onChange: (event) => {
                                            const compat = { ...draft.compat };
                                            if (event.target.value === '')
                                                delete compat.thinkingFormat;
                                            else
                                                compat.thinkingFormat = event.target.value;
                                            onChange({ ...draft, compat });
                                        }, children: [_jsx("option", { value: "", children: t('thinkingFormatDefault') }), formats.map(format => _jsx("option", { value: format, children: format }, format))] })] }), _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: draft.compat.supportsDeveloperRole === false, disabled: disabled, onChange: (event) => {
                                            const compat = { ...draft.compat };
                                            if (event.target.checked)
                                                compat.supportsDeveloperRole = false;
                                            else
                                                delete compat.supportsDeveloperRole;
                                            onChange({ ...draft, compat });
                                        } }), t('supportsDeveloperRole')] }), _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: draft.compat.supportsReasoningEffort === false, disabled: disabled, onChange: (event) => {
                                            const compat = { ...draft.compat };
                                            if (event.target.checked)
                                                compat.supportsReasoningEffort = false;
                                            else
                                                delete compat.supportsReasoningEffort;
                                            onChange({ ...draft, compat });
                                        } }), t('supportsReasoningEffort')] })] })] }), clientError !== undefined ? _jsx("p", { className: css.error, children: clientError }) : null, _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.secondaryButton, disabled: busy || !dirty(draft), onClick: () => { props.onCancel(draft); }, children: t('cancel') }), _jsx("button", { type: "button", className: css.primaryButton, disabled: disabled || !dirty(draft) || draft.models.length === 0 || clientError !== undefined, onClick: () => { props.onSave(draft); }, children: busy ? t('saving') : t('save') })] })] }));
}
export function EffortDeclareSection(props) {
    const t = props.t;
    const api = props.api;
    const describe = props.describe;
    const schema = props.schema;
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [writable, setWritable] = useState(false);
    const [formats, setFormats] = useState([...FALLBACK_THINKING_FORMATS]);
    const [drafts, setDrafts] = useState([]);
    const [busyRoute, setBusyRoute] = useState(null);
    const reload = useCallback(() => {
        if (api === undefined || describe === undefined || schema === undefined) {
            setStatus('error');
            setError(t('loadError'));
            return;
        }
        setStatus('loading');
        setError('');
        void loadDrafts(api, describe, schema).then((result) => {
            setWritable(result.writable);
            setFormats(result.formats);
            setDrafts(result.drafts);
            if (result.error !== undefined) {
                setStatus('error');
                setError(result.error);
                return;
            }
            setStatus('ready');
        }, (failure) => {
            setStatus('error');
            setError(failure instanceof Error ? failure.message : t('loadError'));
        });
    }, [api, describe, schema, t]);
    useEffect(() => { reload(); }, [reload]);
    useEffect(() => {
        if (props.onInvalidate === undefined)
            return undefined;
        return props.onInvalidate(() => { reload(); });
    }, [props.onInvalidate, reload]);
    const save = async (draft) => {
        if (api === undefined)
            return;
        const blocking = draft.models
            .map(row => errorText(modelEffortError(row), t))
            .find(text => text !== undefined);
        if (blocking !== undefined) {
            setError(blocking);
            return;
        }
        setBusyRoute(draft.provider);
        setError('');
        setNotice('');
        try {
            const ops = buildSaveOps({
                route: draft.provider,
                beforeModels: draft.originalModels,
                afterModels: draft.models,
                beforeCompat: draft.compatPresent ? draft.originalCompat : undefined,
                afterCompat: draft.compat,
            });
            if (ops.length === 0) {
                setBusyRoute(null);
                return;
            }
            const response = await api.settings.mutate({
                ns: LLM_PI_AI_NS,
                ops,
                expectedRevision: draft.revision,
            });
            if (!response.result.ok) {
                setError(response.result.error.code === 'settings-conflict' ? t('conflict') : response.result.error.message);
                return;
            }
            setNotice(t('saved'));
            reload();
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : t('loadError'));
        }
        finally {
            setBusyRoute(null);
        }
    };
    return (_jsxs("div", { className: css.section, children: [_jsx("h2", { className: css.title, children: t('title') }), _jsx("p", { className: css.intro, children: t('intro') }), !writable && status === 'ready' ? _jsx("p", { className: css.notice, children: t('readOnly') }) : null, error !== '' ? _jsx("p", { className: css.error, children: error }) : null, notice !== '' ? _jsx("p", { className: css.savedNotice, children: notice }) : null, status === 'error'
                ? (_jsx("button", { type: "button", className: css.secondaryButton, onClick: reload, children: t('reload') }))
                : null, status === 'ready' && drafts.length === 0
                ? (_jsxs(_Fragment, { children: [_jsx("p", { className: css.notice, children: t('empty') }), _jsx("p", { className: css.intro, children: t('emptyHint') })] }))
                : (_jsx("ul", { className: css.rows, children: drafts.map(draft => (_jsx(RouteCard, { draft: draft, formats: formats, writable: writable, busy: busyRoute === draft.provider, t: t, onChange: (next) => {
                            setDrafts(current => current.map(row => row.provider === next.provider ? next : row));
                        }, onSave: (next) => { void save(next); }, onCancel: (next) => {
                            setDrafts(current => current.map(row => row.provider === next.provider
                                ? {
                                    ...row,
                                    models: cloneModels(row.originalModels),
                                    compat: cloneObject(row.originalCompat),
                                }
                                : row));
                        } }, draft.provider))) }))] }));
}
