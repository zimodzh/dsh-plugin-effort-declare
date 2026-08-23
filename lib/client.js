window.__ModuleLoader__.load({
	id: "dsh-plugin-effort-declare",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/core/catalog.ts
		/**
		* Canonical thinking levels and openai-completions thinkingFormat names.
		*
		* Levels match `@deepseek-ai/dsh-llm-pi-ai` catalog.ts `THINKING_LEVELS`.
		* Formats match `SUPPORTED_THINKING_FORMATS` in the same file (rc.8).
		* Tests pin these lists against a checked-in schema fixture
		* (`tests/fixtures/pi-ai-thinking-format-union.ts`) and the local level
		* whitelist. The settings page never offers the handwritten thinkingFormat
		* list as writable choices — only the live schema union, plus a stored
		* value that the union omitted.
		*/
		/** Selectable reasoning levels, in pi-ai escalation order. */
		const THINKING_LEVELS = [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		];
		/** Thinking levels other than Off; Off has its own tri-state control. */
		const THINKING_LEVELS_WITHOUT_OFF = THINKING_LEVELS.filter((level) => level !== "off");
		/** Wire protocol this plugin's v1 editor supports. */
		const OPENAI_COMPLETIONS = "openai-completions";
		/** Settings namespace this plugin writes. */
		const LLM_PI_AI_NS = "llm-pi-ai";
		/** Any route key walks a dict schema to the same profile node. */
		const SCHEMA_PROBE_ROUTE = "\0probe";
		//#endregion
		//#region src/core/paths.ts
		/**
		* Nested get/has over plain JSON, matching ui-settings SettingsSchemaService
		* for the paths this plugin needs. Kept in-repo so tests do not import a
		* Cordis service.
		*/
		/** Read a nested value by string keys / array indexes. */
		function getPath(value, path) {
			let current = value;
			for (const key of path) {
				if (Array.isArray(current)) {
					current = current[Number(key)];
					continue;
				}
				if (typeof current !== "object" || current === null) return void 0;
				current = current[key];
			}
			return current;
		}
		/** Plain object (not array, not null). */
		function isPlainObject(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		/** Structured clone of a JSON object, or `{}` when the source is not one. */
		function cloneObject(value) {
			return isPlainObject(value) ? structuredClone(value) : {};
		}
		/** Structured clone of a models array; non-arrays and non-object rows are skipped. */
		function cloneModels(value) {
			if (!Array.isArray(value)) return [];
			return value.flatMap((row) => isPlainObject(row) ? [structuredClone(row)] : []);
		}
		//#endregion
		//#region src/core/filter.ts
		/**
		* Resolve the wire protocol for a route.
		* User/effective `api` wins; then schema default; then openai-completions.
		*/
		function resolveRouteApi(profile, schemaDefault) {
			if (isPlainObject(profile) && typeof profile.api === "string" && profile.api.length > 0) return profile.api;
			if (schemaDefault !== void 0 && schemaDefault.length > 0) return schemaDefault;
			return OPENAI_COMPLETIONS;
		}
		/**
		* v1 editable routes: hand-declared llm-pi-ai openai-completions.
		* Catalog routes are excluded (writing `models` replaces the whole catalog).
		*/
		function classifyRoute(entry, profile, schemaDefaultApi) {
			if (entry.provider === "deepseek-official" || entry.settingsNs === "llm-deepseek") return {
				editable: false,
				reason: "official-deepseek"
			};
			if (entry.settingsNs !== "llm-pi-ai") return {
				editable: false,
				reason: "not-pi-ai"
			};
			if (entry.declared !== true) return {
				editable: false,
				reason: "catalog"
			};
			if (resolveRouteApi(profile, schemaDefaultApi) !== "openai-completions") return {
				editable: false,
				reason: "not-completions"
			};
			return { editable: true };
		}
		/** Profile object at `providers.<route>` from an llm-pi-ai section value. */
		function profileAt(section, settingsPath, provider) {
			return getPath(section, settingsPath !== void 0 && settingsPath.length > 0 ? settingsPath : ["providers", provider]);
		}
		/** String choices from a schemastery union node (`type: 'union'`). */
		function unionStringChoices(node) {
			if (!isPlainObject(node) || node.type !== "union" || !Array.isArray(node.list)) return [];
			return node.list.map((entry) => isPlainObject(entry) ? entry.value : void 0).filter((value) => typeof value === "string");
		}
		//#endregion
		//#region src/core/path-ops.ts
		/**
		* The minimal path ops carrying `after` over `before`.
		* @param base - path of the edited subtree.
		* @param before - subtree as loaded, or undefined when new.
		* @param after - subtree as edited.
		*/
		function pathOps(base, before, after) {
			const previous = typeof before === "object" && before !== null && !Array.isArray(before) ? before : {};
			const ops = [];
			for (const [key, value] of Object.entries(after)) {
				if (JSON.stringify(previous[key]) === JSON.stringify(value)) continue;
				ops.push({
					op: "set",
					path: [...base, key],
					value
				});
			}
			for (const key of Object.keys(previous)) if (!(key in after)) ops.push({
				op: "unset",
				path: [...base, key]
			});
			return ops;
		}
		/**
		* Ops for one route: whole-array `models` replace when the table changed,
		* plus one-level compat path ops. Never replace the `llm-pi-ai` section.
		*/
		function buildSaveOps(slices) {
			const base = [...slices.settingsPath];
			const ops = [];
			if (JSON.stringify(slices.beforeModels) !== JSON.stringify(slices.afterModels)) ops.push({
				op: "set",
				path: [...base, "models"],
				value: slices.afterModels
			});
			if (slices.afterCompat !== void 0) ops.push(...pathOps([...base, "compat"], slices.beforeCompat, slices.afterCompat));
			return ops;
		}
		//#endregion
		//#region src/core/drafts.ts
		/**
		* Route-card draft merge: user-layer slices, namespace revision, dirty preserve.
		* No React — settings UI and tests share these helpers.
		*/
		/** JSON-stable equality matching pathOps (key order included). */
		function sliceEqual(left, right) {
			return JSON.stringify(left) === JSON.stringify(right);
		}
		/** Whether two settings slices differ. */
		function sliceChanged(before, after) {
			return !sliceEqual(before, after);
		}
		/** Build a draft from the stored user subtree (never from effective `value`). */
		function routeDraftFromUserProfile(args) {
			const { provider, displayName, settingsPath, revision, userProfile } = args;
			const models = cloneModels(isPlainObject(userProfile) ? userProfile.models : []);
			const compatPresent = isPlainObject(userProfile) && "compat" in userProfile && isPlainObject(userProfile.compat);
			const compat = cloneObject(isPlainObject(userProfile) ? userProfile.compat : {});
			return {
				provider,
				displayName,
				settingsPath: [...settingsPath],
				revision,
				models,
				originalModels: cloneModels(models),
				compat,
				originalCompat: cloneObject(compat),
				compatPresent
			};
		}
		/** Dirty iff pathOps would emit something (same comparison as save). */
		function draftDirty(draft) {
			return buildSaveOps({
				settingsPath: draft.settingsPath,
				beforeModels: draft.originalModels,
				afterModels: draft.models,
				beforeCompat: draft.compatPresent ? draft.originalCompat : void 0,
				afterCompat: draft.compat
			}).length > 0;
		}
		/** Treat the current models/compat as the committed originals (no-op save). */
		function alignDraft(draft) {
			return {
				...draft,
				originalModels: cloneModels(draft.models),
				originalCompat: cloneObject(draft.compat),
				compatPresent: Object.keys(draft.compat).length > 0 ? true : draft.compatPresent
			};
		}
		/** Fold a successful mutate view: saved card realigns; every card gets the new revision. */
		function applySaveSuccess(drafts, savedProvider, slice) {
			return drafts.map((draft) => {
				if (draft.provider !== savedProvider) return {
					...draft,
					revision: slice.revision
				};
				const userProfile = profileAt(slice.user, draft.settingsPath, draft.provider);
				return routeDraftFromUserProfile({
					provider: draft.provider,
					displayName: draft.displayName,
					settingsPath: draft.settingsPath,
					revision: slice.revision,
					userProfile
				});
			});
		}
		function modelRowId(row) {
			return String(row.id);
		}
		function indexById(rows) {
			const map = /* @__PURE__ */ new Map();
			for (const row of rows) {
				const id = modelRowId(row);
				if (!map.has(id)) map.set(id, row);
			}
			return map;
		}
		function effortsPresence(row) {
			if (row === void 0 || !Object.hasOwn(row, "reasoningEfforts")) return {
				present: false,
				value: void 0
			};
			return {
				present: true,
				value: row.reasoningEfforts
			};
		}
		function effortsEqual(left, right) {
			if (left.present !== right.present) return false;
			if (!left.present) return true;
			return sliceEqual(left.value, right.value);
		}
		function overlayLocalEfforts(incomingRow, prevRow) {
			const next = structuredClone(incomingRow);
			if (Object.hasOwn(prevRow, "reasoningEfforts")) next.reasoningEfforts = structuredClone(prevRow.reasoningEfforts);
			else delete next.reasoningEfforts;
			return next;
		}
		function objectKeyChanged(left, right, key) {
			const leftHas = Object.hasOwn(left, key);
			if (leftHas !== Object.hasOwn(right, key)) return true;
			if (!leftHas) return false;
			return sliceChanged(left[key], right[key]);
		}
		/**
		* Membership follows the latest user-layer models list (Models page add/delete).
		* Local unsaved `reasoningEfforts` (including a cleared key) overlay by id.
		*/
		function mergeModelsById(args) {
			const prevById = indexById(args.prevModels);
			const prevOrigById = indexById(args.prevOriginal);
			const incomingOrigById = indexById(args.incomingOriginal);
			const incomingIds = new Set(args.incomingModels.map(modelRowId));
			let conflicted = false;
			const models = args.incomingModels.map((incomingRow) => {
				const id = modelRowId(incomingRow);
				const prevRow = prevById.get(id);
				if (prevRow === void 0) return structuredClone(incomingRow);
				const prevOrig = prevOrigById.get(id);
				if (!!effortsEqual(effortsPresence(prevRow), effortsPresence(prevOrig))) return structuredClone(incomingRow);
				const incomingOrig = incomingOrigById.get(id);
				if (!effortsEqual(effortsPresence(prevOrig), effortsPresence(incomingOrig))) conflicted = true;
				return overlayLocalEfforts(incomingRow, prevRow);
			});
			for (const [id, prevRow] of prevById) {
				if (incomingIds.has(id)) continue;
				const prevOrig = prevOrigById.get(id);
				if (effortsEqual(effortsPresence(prevRow), effortsPresence(prevOrig))) continue;
				if (!effortsEqual(effortsPresence(prevOrig), effortsPresence(incomingOrigById.get(id)))) conflicted = true;
			}
			return {
				models,
				conflicted
			};
		}
		/**
		* Three-way compat merge: locally changed keys stay local; everything else
		* follows incoming. Conflict only when a locally dirty key also moved in originals.
		*/
		function mergeCompat(args) {
			if (!sliceChanged(args.prev, args.prevOriginal)) return {
				compat: cloneObject(args.incoming),
				conflicted: false
			};
			const compat = cloneObject(args.incoming);
			let conflicted = false;
			const keys = /* @__PURE__ */ new Set([...Object.keys(args.prev), ...Object.keys(args.prevOriginal)]);
			for (const key of keys) {
				if (!objectKeyChanged(args.prev, args.prevOriginal, key)) continue;
				if (objectKeyChanged(args.prevOriginal, args.incomingOriginal, key)) conflicted = true;
				if (Object.hasOwn(args.prev, key)) compat[key] = structuredClone(args.prev[key]);
				else delete compat[key];
			}
			return {
				compat,
				conflicted
			};
		}
		/**
		* Apply a freshly loaded table. Membership and metadata follow incoming;
		* unsaved reasoningEfforts / dirty compat keys overlay by id. Conflict only
		* when a locally dirty field also changed in originals (revision-only bumps
		* and sibling-card saves do not warn).
		*/
		function mergeLoadedDrafts(current, incoming, options) {
			const currentByProvider = new Map(current.map((draft) => [draft.provider, draft]));
			const conflicted = [];
			return {
				drafts: incoming.map((next) => {
					const prev = currentByProvider.get(next.provider);
					if (prev === void 0 || !options.preserveDirty || !draftDirty(prev)) return next;
					const modelsMerge = mergeModelsById({
						prevModels: prev.models,
						prevOriginal: prev.originalModels,
						incomingModels: next.models,
						incomingOriginal: next.originalModels
					});
					const compatMerge = mergeCompat({
						prev: prev.compat,
						prevOriginal: prev.originalCompat,
						incoming: next.compat,
						incomingOriginal: next.originalCompat
					});
					if (modelsMerge.conflicted || compatMerge.conflicted) conflicted.push(next.provider);
					return {
						provider: next.provider,
						displayName: next.displayName,
						settingsPath: next.settingsPath,
						revision: next.revision,
						models: modelsMerge.models,
						originalModels: cloneModels(next.originalModels),
						compat: compatMerge.compat,
						originalCompat: cloneObject(next.originalCompat),
						compatPresent: next.compatPresent
					};
				}),
				conflicted
			};
		}
		/** Increment a generation counter; callers discard stale async settlements. */
		function nextGeneration(holder) {
			holder.current += 1;
			return holder.current;
		}
		/** Whether `generation` is still the latest issued token. */
		function generationIsCurrent(holder, generation) {
			return holder.current === generation;
		}
		/** Keep a stored thinkingFormat visible even if the schema union omitted it. */
		function thinkingFormatChoices(formats, current) {
			if (typeof current === "string" && current.length > 0 && !formats.includes(current)) return [current, ...formats];
			return [...formats];
		}
		//#endregion
		//#region src/core/efforts.ts
		/** Read Off's three states from a stored dict. */
		function readOff(efforts) {
			if (efforts === void 0 || !("off" in efforts) || efforts.off === void 0) return {
				mode: "absent",
				value: "none"
			};
			if (efforts.off === null) return {
				mode: "empty",
				value: "none"
			};
			return {
				mode: "value",
				value: efforts.off
			};
		}
		/** Write Off's three states onto a dict (does not mutate the input). */
		function writeOff(efforts, mode, value) {
			const next = { ...efforts };
			delete next.off;
			if (mode === "empty") next.off = null;
			else if (mode === "value") {
				const trimmed = value.trim();
				next.off = trimmed.length > 0 ? trimmed : "none";
			}
			return next;
		}
		/** Whether a thinking level (other than Off) is currently declared. */
		function hasLevel(efforts, level) {
			return efforts !== void 0 && efforts[level] !== void 0 && efforts[level] !== null;
		}
		/** Toggle a non-off level. New levels default the wire spelling to the key. */
		function toggleLevel(efforts, level, enabled, wire) {
			const next = { ...efforts };
			if (enabled) next[level] = wire !== void 0 && wire.length > 0 ? wire : level;
			else delete next[level];
			return next;
		}
		/** Set the wire spelling for a declared non-off level. */
		function setWireSpelling(efforts, level, wire) {
			if (!hasLevel(efforts, level)) return efforts;
			return {
				...efforts,
				[level]: wire
			};
		}
		/**
		* Validate a reasoningEfforts field. Returns an error code; never throws.
		* Absence / `false` are valid (default-off / catalog strip). Empty dict and
		* off-only are rejected by the official resolver.
		*/
		function validateReasoningEfforts(efforts) {
			if (efforts === void 0 || efforts === false) return void 0;
			if (efforts === null || typeof efforts === "object" && !Array.isArray(efforts) && Object.keys(efforts).length === 0) return "empty";
			if (typeof efforts !== "object" || Array.isArray(efforts)) return "empty";
			const record = efforts;
			const known = new Set(THINKING_LEVELS);
			for (const key of Object.keys(record)) if (!known.has(key)) return "bad-wire";
			const declared = THINKING_LEVELS.flatMap((level) => {
				if (!(level in record) || record[level] === void 0) return [];
				return [[level, record[level]]];
			});
			for (const [level, wire] of declared) if (wire === null) {
				if (level !== "off") return "bad-wire";
			} else if (typeof wire !== "string" || wire.length === 0) return "bad-wire";
			if (!declared.some(([level]) => level !== "off")) return "off-only";
		}
		/** Drop reasoningEfforts from a model row; keep every other field. */
		function clearReasoningEfforts(row) {
			const next = { ...row };
			delete next.reasoningEfforts;
			return next;
		}
		/** Read reasoningEfforts from a model row. `false` is treated as absent for the editor. */
		function readEfforts(row) {
			const value = row.reasoningEfforts;
			if (value === void 0 || value === false || value === null) return void 0;
			if (typeof value !== "object" || Array.isArray(value)) return void 0;
			return value;
		}
		/** Put a dict (or omit the field) onto a spread row. */
		function writeEfforts(row, efforts) {
			const next = { ...row };
			if (efforts === void 0 || Object.keys(efforts).length === 0) {
				delete next.reasoningEfforts;
				return next;
			}
			next.reasoningEfforts = efforts;
			return next;
		}
		const PRESETS = {
			deepseek: {
				id: "deepseek",
				efforts: {
					off: null,
					low: "low",
					high: "high",
					max: "max"
				},
				compat: {
					thinkingFormat: "set",
					thinkingFormatValue: "deepseek",
					supportsDeveloperRole: "set-false",
					supportsReasoningEffort: "unset"
				},
				warnSameWire: false
			},
			openai: {
				id: "openai",
				efforts: {
					minimal: "minimal",
					low: "low",
					medium: "medium",
					high: "high"
				},
				compat: {
					thinkingFormat: "unset",
					supportsDeveloperRole: "unset",
					supportsReasoningEffort: "unset"
				},
				warnSameWire: false
			},
			toggle: {
				id: "toggle",
				efforts: {
					off: null,
					high: "high"
				},
				compat: {
					thinkingFormat: "unset",
					supportsDeveloperRole: "unset",
					supportsReasoningEffort: "set-false"
				},
				warnSameWire: true
			}
		};
		/** Apply a preset's efforts onto every model row (spread, keep other fields). */
		function applyPresetEfforts(models, preset) {
			return models.map((row) => ({
				...row,
				reasoningEfforts: { ...preset.efforts }
			}));
		}
		/** Merge a preset's compat patch onto the current route-level compat object. */
		function applyPresetCompat(compat, preset) {
			const next = { ...compat };
			const { compat: patch } = preset;
			if (patch.thinkingFormat === "unset") delete next.thinkingFormat;
			else if (patch.thinkingFormat === "set" && patch.thinkingFormatValue !== void 0) next.thinkingFormat = patch.thinkingFormatValue;
			if (patch.supportsDeveloperRole === "unset") delete next.supportsDeveloperRole;
			else if (patch.supportsDeveloperRole === "set-false") next.supportsDeveloperRole = false;
			if (patch.supportsReasoningEffort === "unset") delete next.supportsReasoningEffort;
			else if (patch.supportsReasoningEffort === "set-false") next.supportsReasoningEffort = false;
			return next;
		}
		//#endregion
		//#region src/core/validate.ts
		/** Per-model client-side check used to show errors without throwing. */
		function modelEffortError(row) {
			if (!("reasoningEfforts" in row) || row.reasoningEfforts === void 0) return void 0;
			return validateReasoningEfforts(row.reasoningEfforts);
		}
		//#endregion
		//#region src/core/attribution.ts
		/**
		* Plugin footer attribution. Version and end-year are frozen into the client
		* bundle at pack time; this module only formats the line.
		*/
		/** First publication year (LICENSE). Not the user's wall clock. */
		const COPYRIGHT_FROM = 2026;
		const COPYRIGHT_HOLDER = "Stardust";
		/**
		* `0.1.2 © 2026 Stardust` or `0.1.2 © 2026–2027 Stardust`.
		* Throws if version is empty or `to < from` — a bad stamp must not render.
		*/
		function formatAttribution(version, from, to) {
			if (version.trim() === "") throw new Error("plugin version must be a non-empty string");
			if (!Number.isInteger(from) || !Number.isInteger(to) || to < from) throw new Error(`invalid copyright range: ${String(from)}\u2013${String(to)}`);
			return `${version} \u00a9 ${to === from ? String(from) : `${String(from)}\u2013${String(to)}`} ${COPYRIGHT_HOLDER}`;
		}
		//#endregion
		//#region src/client/build-info.ts
		/**
		* Footer line frozen into the client bundle. Do not read the clock or
		* package.json at DSH startup — host apply is empty and the settings page
		* runs in the browser.
		*/
		const PLUGIN_FOOTER_TEXT = formatAttribution("0.1.3", COPYRIGHT_FROM, 2026);
		//#endregion
		//#region src/client/load-drafts.ts
		function schemaDefaultString(node) {
			if (!isPlainObject(node) || !isPlainObject(node.meta)) return void 0;
			return typeof node.meta.default === "string" ? node.meta.default : void 0;
		}
		/** Namespace revision on a describe snapshot, if that row exists. */
		function namespaceRevision(snapshot, ns) {
			return snapshot.view?.namespaces.find((view) => view.ns === ns)?.revision;
		}
		/**
		* True when `incoming` is the Host echo of a mutate this page already folded,
		* or an older revision the snapshot has already passed. `echoed` is undefined
		* until the first successful write.
		*/
		function isOwnDocumentEcho(echoed, incoming) {
			return echoed !== void 0 && incoming <= echoed;
		}
		/**
		* After a preserve-dirty reload: conflicted cards get a conflict notice;
		* live cards drop leftover conflict/error; saved notices stay; gone cards drop.
		*/
		function foldReloadNotices(current, args) {
			const live = new Set(args.liveProviders);
			const conflicted = new Set(args.conflicted);
			const next = {};
			for (const [provider, notice] of Object.entries(current)) {
				if (!live.has(provider)) continue;
				if (conflicted.has(provider)) continue;
				if (notice.kind === "conflict" || notice.kind === "error") continue;
				next[provider] = notice;
			}
			for (const provider of args.conflicted) next[provider] = args.conflictNotice;
			return next;
		}
		function waitUntil(describe, predicate, signal) {
			if (signal?.aborted) return Promise.resolve(false);
			if (predicate()) return Promise.resolve(true);
			return new Promise((resolve) => {
				let settled = false;
				const finish = (ok) => {
					if (settled) return;
					settled = true;
					stop();
					signal?.removeEventListener("abort", onAbort);
					resolve(ok);
				};
				const onAbort = () => {
					finish(false);
				};
				const stop = describe.subscribe(() => {
					if (predicate()) finish(true);
				});
				signal?.addEventListener("abort", onAbort);
				if (predicate()) finish(true);
				else if (signal?.aborted) finish(false);
			});
		}
		/** Resolve when the mirror's namespace revision is at least `revision`, or abort. */
		async function waitForNamespaceRevision(describe, ns, revision, signal) {
			return await waitUntil(describe, () => {
				const current = namespaceRevision(describe.getSnapshot(), ns);
				return current !== void 0 && current >= revision;
			}, signal) ? "matched" : "aborted";
		}
		/** Resolve when the namespace revision differs from `previous`, or abort. */
		async function waitForNamespaceRevisionChange(describe, ns, previous, signal) {
			return await waitUntil(describe, () => {
				const current = namespaceRevision(describe.getSnapshot(), ns);
				return current !== void 0 && current !== previous;
			}, signal) ? "changed" : "aborted";
		}
		async function assembleDrafts(api, describe, schema) {
			const mirrored = describe.getSnapshot();
			if (mirrored.view === void 0) return {
				writable: false,
				formats: [],
				drafts: [],
				error: mirrored.error ?? void 0
			};
			const providersResponse = await api.llm.providers({});
			if (!providersResponse.result.ok) return {
				writable: mirrored.view.writable,
				formats: [],
				drafts: [],
				error: providersResponse.result.error.message
			};
			const pi = new Map(mirrored.view.namespaces.map((view) => [view.ns, view])).get(LLM_PI_AI_NS);
			let formats = [];
			let schemaDefaultApi;
			if (pi !== void 0) try {
				const root = schema.rehydrate(pi.schema);
				const fromSchema = unionStringChoices(schema.nodeAtPath(root, [
					"providers",
					SCHEMA_PROBE_ROUTE,
					"compat",
					"thinkingFormat"
				]));
				if (fromSchema.length > 0) formats = fromSchema;
				schemaDefaultApi = schemaDefaultString(schema.nodeAtPath(root, [
					"providers",
					SCHEMA_PROBE_ROUTE,
					"api"
				]));
			} catch {}
			const drafts = [];
			for (const entry of providersResponse.result.value.providers) {
				const settingsPath = entry.settingsPath !== void 0 && entry.settingsPath.length > 0 ? [...entry.settingsPath] : ["providers", entry.provider];
				if (!classifyRoute(entry, profileAt(pi?.value, settingsPath, entry.provider), schemaDefaultApi).editable) continue;
				drafts.push(routeDraftFromUserProfile({
					provider: entry.provider,
					displayName: entry.displayName ?? entry.provider,
					settingsPath,
					revision: pi?.revision ?? 0,
					userProfile: profileAt(pi?.user, settingsPath, entry.provider)
				}));
			}
			return {
				writable: mirrored.view.writable,
				formats,
				drafts
			};
		}
		/**
		* `ensure`: first paint / idle recovery (official ensure only reads from idle).
		* `snapshot`: refresh after the mirror revision already moved — do not ensure.
		*/
		async function loadDrafts(api, describe, schema, mode = "ensure") {
			if (mode === "ensure") await describe.ensure();
			return assembleDrafts(api, describe, schema);
		}
		//#endregion
		//#region src/client/schema-ops.ts
		/** Wrap a live settingsSchema service as plain callbacks. */
		function bindSchema(service) {
			return {
				rehydrate: (serialized) => service.rehydrate(serialized),
				nodeAtPath: (root, path) => service.nodeAtPath(root, path),
				getPath: (value, path) => service.getPath(value, path),
				hasPath: (value, path) => service.hasPath(value, path),
				validate: (node, draft) => service.validate(node, draft)
			};
		}
		/**
		* Pre-mutate schema check used by the settings page.
		* A returned string means do not call `settings.mutate`.
		*/
		function validateSaveDraft(schema, root, settingsPath, afterModels, afterCompat, willWriteCompat) {
			const modelsNode = schema.nodeAtPath(root, [...settingsPath, "models"]);
			if (modelsNode !== void 0) {
				const error = schema.validate(modelsNode, afterModels);
				if (error !== void 0) return error;
			}
			if (willWriteCompat) {
				const compatNode = schema.nodeAtPath(root, [...settingsPath, "compat"]);
				if (compatNode !== void 0) {
					const error = schema.validate(compatNode, afterCompat);
					if (error !== void 0) return error;
				}
			}
		}
		//#endregion
		//#region \0dsh-css:C:\Users\zimo\AppData\Roaming\io.github.hairyf.deepseek-harness-desktop\data\dsh\临时目录\dsh-plugin-effort-declare\src\client\effort-declare.module.css.mjs
		const cssText = ".hYEBUa_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.hYEBUa_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.hYEBUa_intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:14px;line-height:22px}.hYEBUa_notice{color:var(--dsw-alias-state-warn-label);margin:0;font-size:12px;line-height:18px}.hYEBUa_savedNotice{color:var(--dsw-alias-state-success-primary);margin:0;font-size:12px;line-height:18px}.hYEBUa_error{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px;line-height:18px}.hYEBUa_rows{flex-direction:column;gap:8px;margin:12px 0 0;padding:0;list-style:none;display:flex}.hYEBUa_rowCard{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:12px;padding:12px 14px;display:flex}.hYEBUa_rowHead{align-items:baseline;gap:8px;display:flex}.hYEBUa_rowName{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.hYEBUa_rowTag{border:1px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-secondary);border-radius:4px;flex:none;padding:1px 6px;font-size:11px;line-height:16px}.hYEBUa_compatSummary{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.hYEBUa_presetRow,.hYEBUa_actions{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.hYEBUa_fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}.hYEBUa_primaryButton,.hYEBUa_secondaryButton{box-sizing:border-box;height:36px;font:inherit;cursor:pointer;border-radius:18px;justify-content:center;align-items:center;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.hYEBUa_primaryButton{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border:none}.hYEBUa_primaryButton:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.hYEBUa_secondaryButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:0 0}.hYEBUa_secondaryButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-solid)}.hYEBUa_primaryButton:disabled,.hYEBUa_secondaryButton:disabled,.hYEBUa_linkButton:disabled,.hYEBUa_input:disabled{opacity:.4;cursor:default}.hYEBUa_primaryButton:focus-visible,.hYEBUa_secondaryButton:focus-visible,.hYEBUa_linkButton:focus-visible,.hYEBUa_input:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3);outline:none}.hYEBUa_linkButton{box-sizing:border-box;height:28px;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:14px;align-items:center;padding:0 10px;font-size:12px;line-height:18px;display:inline-flex}.hYEBUa_linkButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.hYEBUa_modelEntry{border-top:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;padding:10px 0;display:flex}.hYEBUa_modelHead{flex-wrap:wrap;align-items:baseline;gap:8px;display:flex}.hYEBUa_modelId{font-size:13px;font-weight:500;line-height:20px}.hYEBUa_modelName{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.hYEBUa_levels{flex-wrap:wrap;gap:10px 14px;display:flex}.hYEBUa_level{align-items:center;gap:6px;font-size:12px;line-height:18px;display:inline-flex}.hYEBUa_wireRow{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.hYEBUa_input,.hYEBUa_selectInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);height:32px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:8px;padding:0 10px;font-size:13px}.hYEBUa_wireInput{width:7em}.hYEBUa_offGroup{flex-direction:column;gap:6px;display:flex}.hYEBUa_advanced{border-top:1px solid var(--dsw-alias-border-l2);padding-top:8px}.hYEBUa_advanced summary{cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.hYEBUa_advancedBody{flex-direction:column;gap:10px;padding-top:10px;display:flex}.hYEBUa_check{align-items:flex-start;gap:8px;font-size:12px;line-height:18px;display:flex}.hYEBUa_footer{color:var(--dsw-alias-label-tertiary);opacity:.7;margin:16px 0 0;font-size:11px;line-height:16px}";
		const cssTagId = "dsh-plugin-effort-declare/effort-declare.module.css";
		var effort_declare_module_css_default = {
			"actions": "hYEBUa_actions",
			"advanced": "hYEBUa_advanced",
			"advancedBody": "hYEBUa_advancedBody",
			"check": "hYEBUa_check",
			"compatSummary": "hYEBUa_compatSummary",
			"error": "hYEBUa_error",
			"fieldLabel": "hYEBUa_fieldLabel",
			"footer": "hYEBUa_footer",
			"input": "hYEBUa_input",
			"intro": "hYEBUa_intro",
			"level": "hYEBUa_level",
			"levels": "hYEBUa_levels",
			"linkButton": "hYEBUa_linkButton",
			"modelEntry": "hYEBUa_modelEntry",
			"modelHead": "hYEBUa_modelHead",
			"modelId": "hYEBUa_modelId",
			"modelName": "hYEBUa_modelName",
			"notice": "hYEBUa_notice",
			"offGroup": "hYEBUa_offGroup",
			"presetRow": "hYEBUa_presetRow",
			"primaryButton": "hYEBUa_primaryButton",
			"rowCard": "hYEBUa_rowCard",
			"rowHead": "hYEBUa_rowHead",
			"rowName": "hYEBUa_rowName",
			"rowTag": "hYEBUa_rowTag",
			"rows": "hYEBUa_rows",
			"savedNotice": "hYEBUa_savedNotice",
			"secondaryButton": "hYEBUa_secondaryButton",
			"section": "hYEBUa_section",
			"selectInput": "hYEBUa_selectInput",
			"title": "hYEBUa_title",
			"wireInput": "hYEBUa_wireInput",
			"wireRow": "hYEBUa_wireRow"
		};
		//#endregion
		//#region src/client/EffortDeclareSection.tsx
		/**
		* Settings section: per-model reasoningEfforts + openai-completions compat
		* for hand-declared llm-pi-ai routes.
		*/
		function compatSummary(compat) {
			const parts = [];
			if (typeof compat.thinkingFormat === "string") parts.push(`thinkingFormat=${compat.thinkingFormat}`);
			if (compat.supportsDeveloperRole === false) parts.push("supportsDeveloperRole=false");
			if (compat.supportsReasoningEffort === false) parts.push("supportsReasoningEffort=false");
			return parts.join(" · ");
		}
		function errorText(code, t) {
			if (code === "empty") return t("errorEmpty");
			if (code === "off-only") return t("errorOffOnly");
			if (code === "bad-wire") return t("errorBadWire");
		}
		function ModelRowEditor(props) {
			const { row, disabled, t, onChange } = props;
			const efforts = readEfforts(row) ?? {};
			const off = readOff(readEfforts(row));
			const id = typeof row.id === "string" ? row.id : "";
			const name = typeof row.name === "string" ? row.name : "";
			const patchEfforts = (next) => {
				onChange(writeEfforts(row, Object.keys(next).length === 0 ? void 0 : next));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: effort_declare_module_css_default.modelEntry,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: effort_declare_module_css_default.modelHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: effort_declare_module_css_default.modelId,
								children: id || t("model")
							}),
							name !== "" && name !== id ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: effort_declare_module_css_default.modelName,
								children: name
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: effort_declare_module_css_default.linkButton,
								disabled: disabled || !("reasoningEfforts" in row),
								onClick: () => {
									onChange(clearReasoningEfforts(row));
								},
								children: t("clear")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: effort_declare_module_css_default.fieldLabel,
						children: t("levels")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: effort_declare_module_css_default.levels,
						children: THINKING_LEVELS_WITHOUT_OFF.map((level) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: effort_declare_module_css_default.level,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: hasLevel(efforts, level),
								disabled,
								onChange: (event) => {
									patchEfforts(toggleLevel(efforts, level, event.target.checked));
								}
							}), level]
						}, level))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: effort_declare_module_css_default.wireRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: effort_declare_module_css_default.fieldLabel,
							children: t("wire")
						}), THINKING_LEVELS_WITHOUT_OFF.filter((level) => hasLevel(efforts, level)).map((level) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: effort_declare_module_css_default.level,
							children: [level, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: `${effort_declare_module_css_default.input} ${effort_declare_module_css_default.wireInput}`,
								type: "text",
								value: efforts[level] ?? level,
								disabled,
								"aria-label": `${t("wire")} ${level}`,
								onChange: (event) => {
									patchEfforts(setWireSpelling(efforts, level, event.target.value));
								}
							})]
						}, level))]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: effort_declare_module_css_default.offGroup,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: effort_declare_module_css_default.fieldLabel,
								children: t("offMode")
							}),
							[
								"absent",
								"empty",
								"value"
							].map((mode) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: effort_declare_module_css_default.level,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "radio",
									name: props.radioName,
									checked: off.mode === mode,
									disabled,
									onChange: () => {
										patchEfforts(writeOff(efforts, mode, off.value));
									}
								}), mode === "absent" ? t("offAbsent") : mode === "empty" ? t("offEmpty") : t("offValue")]
							}, mode)),
							off.mode === "value" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: `${effort_declare_module_css_default.input} ${effort_declare_module_css_default.wireInput}`,
								type: "text",
								value: off.value,
								placeholder: t("offValuePlaceholder"),
								disabled,
								onChange: (event) => {
									patchEfforts(writeOff(efforts, "value", event.target.value));
								}
							}) : null
						]
					})
				]
			});
		}
		function RouteCard(props) {
			const { draft, writable, busy, saveLocked, t, onChange } = props;
			const noModels = draft.models.length === 0;
			const editDisabled = !writable || busy || noModels;
			const saveDisabled = saveLocked || noModels;
			const formats = thinkingFormatChoices(props.formats, draft.compat.thinkingFormat);
			const summary = compatSummary(draft.compat);
			const sameWire = draft.compat.supportsReasoningEffort === false;
			const clientError = draft.models.map((row) => errorText(modelEffortError(row), t)).find((text) => text !== void 0);
			const dirty = draftDirty(draft);
			const applyPreset = (id) => {
				const preset = PRESETS[id];
				onChange({
					...draft,
					models: applyPresetEfforts(draft.models, preset),
					compat: applyPresetCompat(draft.compat, preset)
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: effort_declare_module_css_default.rowCard,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: effort_declare_module_css_default.rowHead,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: effort_declare_module_css_default.rowName,
							children: draft.displayName
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: effort_declare_module_css_default.rowTag,
							children: draft.provider
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: effort_declare_module_css_default.compatSummary,
						children: [t("compatSummary"), summary === "" ? "" : `: ${summary}`]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: effort_declare_module_css_default.presetRow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: effort_declare_module_css_default.fieldLabel,
								children: t("presets")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: effort_declare_module_css_default.secondaryButton,
								disabled: editDisabled,
								onClick: () => {
									applyPreset("deepseek");
								},
								children: t("presetDeepSeek")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: effort_declare_module_css_default.secondaryButton,
								disabled: editDisabled,
								onClick: () => {
									applyPreset("openai");
								},
								children: t("presetOpenAI")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: effort_declare_module_css_default.secondaryButton,
								disabled: editDisabled,
								onClick: () => {
									applyPreset("toggle");
								},
								children: t("presetToggle")
							})
						]
					}),
					sameWire ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.notice,
						children: t("presetToggleWarn")
					}) : null,
					noModels ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.notice,
						children: t("noModels")
					}) : null,
					draft.models.map((row, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelRowEditor, {
						row,
						index,
						radioName: `off-${draft.provider}-${String(index)}`,
						disabled: editDisabled,
						t,
						onChange: (next) => {
							const models = draft.models.map((candidate, at) => at === index ? next : candidate);
							onChange({
								...draft,
								models
							});
						}
					}, `${String(row.id)}-${String(index)}`)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: effort_declare_module_css_default.advanced,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("advanced") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: effort_declare_module_css_default.advancedBody,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: effort_declare_module_css_default.fieldLabel,
									children: [t("thinkingFormat"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										className: `${effort_declare_module_css_default.input} ${effort_declare_module_css_default.selectInput}`,
										value: typeof draft.compat.thinkingFormat === "string" ? draft.compat.thinkingFormat : "",
										disabled: editDisabled,
										onChange: (event) => {
											const compat = { ...draft.compat };
											if (event.target.value === "") delete compat.thinkingFormat;
											else compat.thinkingFormat = event.target.value;
											onChange({
												...draft,
												compat
											});
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "",
											children: t("thinkingFormatDefault")
										}), formats.map((format) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: format,
											children: format
										}, format))]
									})]
								}),
								draft.compat.supportsDeveloperRole === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: effort_declare_module_css_default.notice,
									children: t("developerTrueHint")
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: effort_declare_module_css_default.check,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: draft.compat.supportsDeveloperRole === false,
										disabled: editDisabled,
										onChange: (event) => {
											const compat = { ...draft.compat };
											if (event.target.checked) compat.supportsDeveloperRole = false;
											else delete compat.supportsDeveloperRole;
											onChange({
												...draft,
												compat
											});
										}
									}), t("supportsDeveloperRole")]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: effort_declare_module_css_default.check,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: draft.compat.supportsReasoningEffort === false,
										disabled: editDisabled,
										onChange: (event) => {
											const compat = { ...draft.compat };
											if (event.target.checked) compat.supportsReasoningEffort = false;
											else delete compat.supportsReasoningEffort;
											onChange({
												...draft,
												compat
											});
										}
									}), t("supportsReasoningEffort")]
								})
							]
						})]
					}),
					clientError !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.error,
						children: clientError
					}) : null,
					props.notice?.kind === "saved" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.savedNotice,
						children: props.notice.text
					}) : null,
					props.notice?.kind === "conflict" || props.notice?.kind === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.error,
						children: props.notice.text
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: effort_declare_module_css_default.actions,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: effort_declare_module_css_default.secondaryButton,
							disabled: busy || !dirty,
							onClick: () => {
								props.onCancel(draft);
							},
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: effort_declare_module_css_default.primaryButton,
							disabled: saveDisabled || !dirty || clientError !== void 0,
							onClick: () => {
								props.onSave(draft);
							},
							children: busy ? t("saving") : t("save")
						})]
					})
				]
			});
		}
		function EffortDeclareSection(props) {
			const t = props.t;
			const api = props.api;
			const describe = props.describe;
			const schema = props.schema;
			const [status, setStatus] = (0, react.useState)("loading");
			const [error, setError] = (0, react.useState)("");
			const [writable, setWritable] = (0, react.useState)(false);
			const [formats, setFormats] = (0, react.useState)([]);
			const [drafts, setDrafts] = (0, react.useState)([]);
			const [busyRoute, setBusyRoute] = (0, react.useState)(null);
			const [notices, setNotices] = (0, react.useState)({});
			const generationRef = (0, react.useRef)(0);
			const draftsRef = (0, react.useRef)(drafts);
			const echoedRevisionRef = (0, react.useRef)(void 0);
			const pendingRevisionRef = (0, react.useRef)(void 0);
			const busyRouteRef = (0, react.useRef)(null);
			const abortRef = (0, react.useRef)(null);
			draftsRef.current = drafts;
			const applyDrafts = (next) => {
				const resolved = typeof next === "function" ? next(draftsRef.current) : next;
				draftsRef.current = resolved;
				setDrafts(resolved);
			};
			const snapshotMode = () => describe === void 0 || describe.getSnapshot().status === "idle" ? "ensure" : "snapshot";
			const beginGeneration = () => {
				abortRef.current?.abort();
				const abort = new AbortController();
				abortRef.current = abort;
				return {
					generation: nextGeneration(generationRef),
					signal: abort.signal
				};
			};
			const failGeneration = (generation, failure) => {
				if (!generationIsCurrent(generationRef, generation)) return;
				setStatus("error");
				setError(failure instanceof Error ? failure.message : t("loadError"));
			};
			const settleReload = (generation, preserveDirty, result) => {
				if (!generationIsCurrent(generationRef, generation)) return;
				setWritable(result.writable);
				setFormats(result.formats);
				if (result.error !== void 0) {
					setStatus("error");
					setError(result.error);
					return;
				}
				const merged = mergeLoadedDrafts(draftsRef.current, result.drafts, { preserveDirty });
				applyDrafts(merged.drafts);
				setNotices((current) => foldReloadNotices(current, {
					conflicted: merged.conflicted,
					conflictNotice: {
						kind: "conflict",
						text: t("dirtyConflict")
					},
					liveProviders: merged.drafts.map((draft) => draft.provider)
				}));
				setStatus("ready");
			};
			const loadSnapshotThenSettle = async (generation, preserveDirty) => {
				if (api === void 0 || describe === void 0 || schema === void 0) return;
				if (!generationIsCurrent(generationRef, generation)) return;
				try {
					const result = await loadDrafts(api, describe, schema, "snapshot");
					settleReload(generation, preserveDirty, result);
				} catch (failure) {
					failGeneration(generation, failure);
				}
			};
			const reload = (0, react.useCallback)((preserveDirty, mode = "ensure") => {
				if (api === void 0 || describe === void 0 || schema === void 0) {
					setStatus("error");
					setError(t("loadError"));
					return;
				}
				const { generation } = beginGeneration();
				if (draftsRef.current.length === 0) setStatus("loading");
				setError("");
				loadDrafts(api, describe, schema, mode).then((result) => {
					settleReload(generation, preserveDirty, result);
				}, (failure) => {
					failGeneration(generation, failure);
				});
			}, [
				api,
				describe,
				schema,
				t
			]);
			const refreshAtRevision = (0, react.useCallback)((revision, preserveDirty) => {
				if (api === void 0 || describe === void 0 || schema === void 0) return;
				const { generation, signal } = beginGeneration();
				if (draftsRef.current.length === 0) setStatus("loading");
				setError("");
				waitForNamespaceRevision(describe, LLM_PI_AI_NS, revision, signal).then((outcome) => {
					if (outcome === "aborted" || !generationIsCurrent(generationRef, generation)) return;
					return loadSnapshotThenSettle(generation, preserveDirty);
				}, (failure) => {
					failGeneration(generation, failure);
				});
			}, [
				api,
				describe,
				schema,
				t
			]);
			const flushPendingSettings = (refresh) => {
				const pending = pendingRevisionRef.current;
				pendingRevisionRef.current = void 0;
				if (pending === void 0) return;
				if (isOwnDocumentEcho(echoedRevisionRef.current, pending)) return;
				refresh(pending, true);
			};
			(0, react.useEffect)(() => {
				reload(false, "ensure");
			}, [reload]);
			(0, react.useEffect)(() => () => {
				abortRef.current?.abort();
				nextGeneration(generationRef);
			}, []);
			(0, react.useEffect)(() => {
				if (props.subscribeInvalidate === void 0) return void 0;
				return props.subscribeInvalidate((event) => {
					if (event.source === "writable") {
						const view = describe?.getSnapshot().view;
						if (view !== void 0) setWritable(view.writable);
						return;
					}
					if (event.source === "settings") {
						if (busyRouteRef.current !== null) {
							pendingRevisionRef.current = event.revision;
							return;
						}
						if (isOwnDocumentEcho(echoedRevisionRef.current, event.revision)) return;
						refreshAtRevision(event.revision, true);
						return;
					}
					if (event.source === "directory") reload(true, snapshotMode());
					if (event.source === "reset") reload(true, "ensure");
				});
			}, [
				describe,
				props.subscribeInvalidate,
				refreshAtRevision,
				reload
			]);
			const patchNotice = (provider, notice) => {
				setNotices((current) => {
					const copy = { ...current };
					if (notice === void 0) delete copy[provider];
					else copy[provider] = notice;
					return copy;
				});
			};
			const save = async (draft) => {
				if (api === void 0 || describe === void 0 || schema === void 0) return;
				if (status === "loading" || busyRouteRef.current !== null) {
					patchNotice(draft.provider, {
						kind: "error",
						text: t("saveBusy")
					});
					return;
				}
				const blocking = draft.models.map((row) => errorText(modelEffortError(row), t)).find((text) => text !== void 0);
				if (blocking !== void 0) {
					patchNotice(draft.provider, {
						kind: "error",
						text: blocking
					});
					return;
				}
				busyRouteRef.current = draft.provider;
				setBusyRoute(draft.provider);
				patchNotice(draft.provider, void 0);
				try {
					const ops = buildSaveOps({
						settingsPath: draft.settingsPath,
						beforeModels: draft.originalModels,
						afterModels: draft.models,
						beforeCompat: draft.compatPresent ? draft.originalCompat : void 0,
						afterCompat: draft.compat
					});
					if (ops.length === 0) {
						applyDrafts((current) => current.map((row) => row.provider === draft.provider ? alignDraft(row) : row));
						return;
					}
					const willWriteCompat = ops.some((op) => op.path.length > draft.settingsPath.length && op.path[draft.settingsPath.length] === "compat");
					const pi = describe.getSnapshot().view?.namespaces.find((view) => view.ns === LLM_PI_AI_NS);
					if (pi !== void 0) {
						let root;
						try {
							root = schema.rehydrate(pi.schema);
						} catch {
							root = void 0;
						}
						if (root !== void 0) {
							const schemaError = validateSaveDraft(schema, root, draft.settingsPath, draft.models, draft.compat, willWriteCompat);
							if (schemaError !== void 0) {
								patchNotice(draft.provider, {
									kind: "error",
									text: schemaError
								});
								return;
							}
						}
					}
					const response = await api.settings.mutate({
						ns: LLM_PI_AI_NS,
						ops,
						expectedRevision: draft.revision
					});
					if (!response.result.ok) {
						const conflict = response.result.error.code === "settings-conflict";
						patchNotice(draft.provider, {
							kind: conflict ? "conflict" : "error",
							text: conflict ? t("conflict") : response.result.error.message
						});
						if (conflict) {
							const { generation, signal } = beginGeneration();
							waitForNamespaceRevisionChange(describe, LLM_PI_AI_NS, draft.revision, signal).then((outcome) => {
								if (outcome === "aborted" || !generationIsCurrent(generationRef, generation)) return;
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
						revision: view.revision
					}));
					patchNotice(draft.provider, {
						kind: "saved",
						text: t("saved")
					});
				} catch (failure) {
					patchNotice(draft.provider, {
						kind: "error",
						text: failure instanceof Error ? failure.message : t("loadError")
					});
				} finally {
					busyRouteRef.current = null;
					setBusyRoute(null);
					flushPendingSettings(refreshAtRevision);
				}
			};
			const showLoading = status === "loading" && drafts.length === 0;
			const showEmpty = status === "ready" && drafts.length === 0;
			const showList = drafts.length > 0;
			const hasCardFailure = Object.values(notices).some((notice) => notice.kind === "conflict" || notice.kind === "error");
			const showReload = status === "error" || hasCardFailure || showEmpty || !writable || status === "loading" || showList;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: effort_declare_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: effort_declare_module_css_default.title,
						children: t("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.intro,
						children: t("intro")
					}),
					!writable && status === "ready" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.notice,
						children: t("readOnly")
					}) : null,
					showLoading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.intro,
						children: t("loading")
					}) : null,
					status === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.error,
						children: error
					}) : null,
					showReload ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: effort_declare_module_css_default.secondaryButton,
						onClick: () => {
							reload(true, snapshotMode());
						},
						children: t("reload")
					}) : null,
					showEmpty ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.notice,
						children: t("empty")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.intro,
						children: t("emptyHint")
					})] }) : null,
					showList ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: effort_declare_module_css_default.rows,
						children: drafts.map((draft) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RouteCard, {
							draft,
							formats: formats.length > 0 ? formats : [],
							writable,
							busy: busyRoute === draft.provider,
							saveLocked: !writable || busyRoute !== null || status === "loading",
							notice: notices[draft.provider],
							t,
							onChange: (next) => {
								patchNotice(next.provider, void 0);
								applyDrafts((current) => current.map((row) => row.provider === next.provider ? next : row));
							},
							onSave: (next) => {
								save(next);
							},
							onCancel: (next) => {
								patchNotice(next.provider, void 0);
								applyDrafts((current) => current.map((row) => row.provider === next.provider ? {
									...row,
									models: cloneModels(row.originalModels),
									compat: cloneObject(row.originalCompat)
								} : row));
							}
						}, draft.provider))
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: effort_declare_module_css_default.footer,
						children: PLUGIN_FOOTER_TEXT
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "plugin-effort-declare";
		const zh = {
			nav: "推理档位",
			title: "推理档位声明",
			intro: "本页声明「这模型能选哪些推理档」。对话里的档位选择仍在输入框模型菜单。没声明 = 和现在一样没有 Effort 行。不会改密钥、目录或当次选择。",
			empty: "没有可编辑的手工 openai-completions 路由。",
			emptyHint: "请先到「模型」页添加提供方（llm-pi-ai 手工路由）。官方 DeepSeek 与 catalog 路由不在本页编辑。需要 DSH ≥ 0.1.0-rc.8（providers.declared）。",
			loadError: "无法加载提供方或设置。",
			loading: "正在加载…",
			readOnly: "当前设置为只读，无法保存。",
			save: "保存",
			saving: "保存中…",
			saveBusy: "另有路由正在保存，请稍候。",
			cancel: "取消",
			saved: "已保存。对话选择器会按新的能力声明显示 Effort 行。",
			conflict: "设置已被其他地方改过，请重新加载后再保存。",
			dirtyConflict: "此路由有未保存修改，设置已在其他地方更新。保存会写到最新文档上，或先取消再改。",
			presets: "预设",
			presetDeepSeek: "DeepSeek 兼容",
			presetOpenAI: "OpenAI 兼容",
			presetToggle: "仅开/关",
			presetToggleWarn: "选择器里多档在线上没有区别：除 Off 外请求体相同。",
			model: "模型",
			levels: "可选档位",
			wire: "线上拼写",
			offMode: "Off",
			offAbsent: "无 Off",
			offEmpty: "Off 且不发参数",
			offValue: "Off 且发字符串",
			offValuePlaceholder: "none",
			clear: "清除本模型声明",
			advanced: "高级：协议方言",
			thinkingFormat: "thinkingFormat",
			thinkingFormatDefault: "默认（省略该键）",
			supportsDeveloperRole: "系统提示走 system 而不是 developer（supportsDeveloperRole: false）",
			supportsReasoningEffort: "不发 reasoning_effort，只发开关（supportsReasoningEffort: false）",
			developerTrueHint: "当前文档是 supportsDeveloperRole: true。v1 只能强制 false 或缺席；勾选会写成 false，取消勾选会删除该键。",
			compatSummary: "协议",
			errorEmpty: "不能保存空的 reasoningEfforts。请选择档位，或清除声明。",
			errorOffOnly: "不能只开 Off，必须再开一档思考档。",
			errorBadWire: "思考档必须填写线上拼写；只有 Off 可以留空。不能使用未知档位键。",
			noModels: "这条路由还没有 models 列表。请先到「模型」页添加模型。",
			reload: "重新加载"
		};
		const en = {
			nav: "Reasoning efforts",
			title: "Reasoning effort declarations",
			intro: "This page declares which reasoning levels a model can offer. The per-turn choice stays in the composer model menu. Undeclared models keep having no Effort row. Keys, catalogs, and the current selection are not edited here.",
			empty: "No editable hand-declared openai-completions routes.",
			emptyHint: "Add a provider on the Models page first (an llm-pi-ai hand-declared route). Official DeepSeek and catalog routes are not edited here. Requires DSH ≥ 0.1.0-rc.8 (providers.declared).",
			loadError: "Could not load providers or settings.",
			loading: "Loading…",
			readOnly: "Settings are read-only; saving is disabled.",
			save: "Save",
			saving: "Saving…",
			saveBusy: "Another route is saving. Wait, then save this card.",
			cancel: "Cancel",
			saved: "Saved. The composer Effort row follows this capability declaration.",
			conflict: "Settings changed elsewhere. Reload, then save again.",
			dirtyConflict: "This route has unsaved edits and settings changed elsewhere. Save writes onto the latest document, or cancel first.",
			presets: "Presets",
			presetDeepSeek: "DeepSeek compatible",
			presetOpenAI: "OpenAI compatible",
			presetToggle: "On/off only",
			presetToggleWarn: "Multiple selector levels are identical on the wire except Off.",
			model: "Model",
			levels: "Offered levels",
			wire: "Wire spelling",
			offMode: "Off",
			offAbsent: "No Off",
			offEmpty: "Off, send nothing",
			offValue: "Off, send a string",
			offValuePlaceholder: "none",
			clear: "Clear this model’s declaration",
			advanced: "Advanced: protocol dialect",
			thinkingFormat: "thinkingFormat",
			thinkingFormatDefault: "Default (omit the key)",
			supportsDeveloperRole: "Send system prompts as system, not developer (supportsDeveloperRole: false)",
			supportsReasoningEffort: "Do not send reasoning_effort; switch only (supportsReasoningEffort: false)",
			developerTrueHint: "The document has supportsDeveloperRole: true. v1 can only force false or omit the key; checking writes false, unchecking deletes the key.",
			compatSummary: "Protocol",
			errorEmpty: "Empty reasoningEfforts cannot be saved. Pick levels, or clear the declaration.",
			errorOffOnly: "Off alone is not enough; declare at least one thinking level.",
			errorBadWire: "Thinking levels need a wire spelling; only Off may be empty. Unknown effort keys are rejected.",
			noModels: "This route has no models list yet. Add models on the Models page first.",
			reload: "Reload"
		};
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"locale",
			"connection",
			"remote",
			"settingsScope",
			"settingsSchema"
		];
		const PLUGIN_ID = "dsh-plugin-effort-declare";
		function mountPluginCss() {
			if (typeof document === "undefined") return () => {};
			const selector = `style[data-plugin-css=${JSON.stringify(cssTagId)}]`;
			let tag = document.querySelector(selector);
			if (tag === null) {
				tag = document.createElement("style");
				tag.dataset.plugin = PLUGIN_ID;
				tag.dataset.pluginCss = cssTagId;
				document.head.appendChild(tag);
			}
			tag.textContent = cssText;
			return () => {
				tag?.remove();
			};
		}
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), `${PLUGIN_ID}: dictionaries`);
			ctx.effect(() => mountPluginCss(), `${PLUGIN_ID}: css`);
			const connection = ctx.get("connection");
			const settingsSchema = ctx.settingsSchema;
			const schema = bindSchema({
				rehydrate: (serialized) => settingsSchema.rehydrate(serialized),
				nodeAtPath: (root, path) => settingsSchema.nodeAtPath(root, path),
				getPath: (value, path) => settingsSchema.getPath(value, path),
				hasPath: (value, path) => settingsSchema.hasPath(value, path),
				validate: (node, draft) => settingsSchema.validate(node, draft)
			});
			const t = ctx.locale.bind(NS);
			const describe = ctx.settingsScope.describe();
			const invalidation = /* @__PURE__ */ new Set();
			ctx.effect(() => {
				const emit = (event) => {
					for (const listener of invalidation) listener(event);
				};
				const disposers = [
					describe.subscribe(() => {
						emit({ source: "writable" });
					}),
					ctx.remote.$on("settings/document-updated", (ns, revision) => {
						if (ns !== "llm-pi-ai") return;
						emit({
							source: "settings",
							revision
						});
					}),
					ctx.remote.$on("llm/adapters-updated", () => {
						emit({ source: "directory" });
					}),
					ctx.on("connection/reset", () => {
						emit({ source: "reset" });
					})
				];
				return () => {
					for (const dispose of disposers) dispose();
				};
			}, `${PLUGIN_ID}: invalidations`);
			const subscribeInvalidate = (listener) => {
				invalidation.add(listener);
				return () => {
					invalidation.delete(listener);
				};
			};
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "effort-declare",
				order: 12,
				label: () => t("nav"),
				locale: NS,
				inject: () => ({
					api: connection.api,
					describe,
					schema,
					subscribeInvalidate
				})
			}, EffortDeclareSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map