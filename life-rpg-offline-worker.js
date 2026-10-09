(function workerRuntime({ base, version, assets }) {
	const prefix = "life-rpg-offline-v1:" + encodeURIComponent(base) + ":";
	const cacheName = prefix + version;
	const urls = assets.map((asset) => new URL(asset.path, self.location.origin).href);
	const paths = new Set(urls);
	const index = new URL(base + "index.html", self.location.origin).href;
	const ownCache = (name) => name.startsWith(prefix);
	const toHex = (bytes) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
	let preparation = new AbortController();
	let preparing = false;
	let problem = false;
	let disabled = false;
	async function prepare(repair = false) {
		if (disabled || preparing) return;
		preparing = true;
		problem = false;
		preparation = new AbortController();
		try {
			const cache = await caches.open(cacheName);
			for (let index = 0; index < assets.length; index++) {
				if (disabled) throw Error("Preparation cancelled");
				if (repair && await cache.match(urls[index])) continue;
				const timer = setTimeout(() => preparation.abort(), 2e4);
				try {
					const response = await fetch(urls[index], {
						cache: "reload",
						credentials: "omit",
						redirect: "error",
						signal: preparation.signal
					});
					if (!response.ok || response.type === "opaque") throw Error("Asset unavailable");
					const body = await response.arrayBuffer();
					if (body.byteLength !== assets[index].bytes || toHex(await crypto.subtle.digest("SHA-256", body)) !== assets[index].digest) throw Error("Asset version changed during preparation");
					if (disabled) throw Error("Preparation cancelled");
					const headers = new Headers(response.headers);
					headers.delete("content-encoding");
					headers.delete("content-length");
					await cache.put(urls[index], new Response(body, {
						status: response.status,
						statusText: response.statusText,
						headers
					}));
					if (disabled) throw Error("Preparation cancelled");
				} finally {
					clearTimeout(timer);
				}
			}
		} catch (error) {
			problem = true;
			if (!repair || disabled) await caches.delete(cacheName);
			throw error;
		} finally {
			preparing = false;
		}
	}
	self.addEventListener("install", (event) => event.waitUntil(prepare()));
	self.addEventListener("activate", (event) => {
		event.waitUntil((async () => {
			for (const name of await caches.keys()) if (ownCache(name) && name !== cacheName) await caches.delete(name);
		})());
	});
	self.addEventListener("fetch", (event) => {
		if (disabled) return;
		const request = event.request;
		if (request.method !== "GET") return;
		const url = new URL(request.url);
		if (url.origin !== self.location.origin) return;
		const navigation = request.mode === "navigate" && (url.pathname === base || url.pathname === base + "index.html");
		if (!navigation && !paths.has(url.href)) return;
		event.respondWith((async () => {
			return await caches.match(navigation ? index : url.href, { cacheName }) || fetch(request);
		})());
	});
	self.addEventListener("message", (event) => {
		if (event.data?.type === "LIFE_RPG_OFFLINE_DISABLE" && event.ports[0]) {
			disabled = true;
			preparation.abort();
			event.waitUntil(caches.delete(cacheName).then(() => event.ports[0].postMessage({
				type: "LIFE_RPG_OFFLINE_DISABLED",
				version
			})));
			return;
		}
		if (event.data?.type === "LIFE_RPG_OFFLINE_REPAIR" && event.ports[0]) {
			event.ports[0].postMessage({
				type: "LIFE_RPG_OFFLINE_REPAIR",
				accepted: !disabled
			});
			if (!disabled) event.waitUntil(prepare(true).catch(() => {}));
			return;
		}
		if (event.data?.type !== "LIFE_RPG_OFFLINE_STATUS" || !event.ports[0]) return;
		event.waitUntil((async () => {
			const names = await caches.keys();
			const cache = !disabled && names.includes(cacheName) ? await caches.open(cacheName) : null;
			if (disabled) await caches.delete(cacheName);
			const keys = new Set(cache ? (await cache.keys()).map((request) => request.url) : []);
			event.ports[0].postMessage({
				type: "LIFE_RPG_OFFLINE_STATUS",
				version,
				scope: base,
				ready: !disabled && urls.every((url) => keys.has(url)),
				preparing,
				problem,
				files: assets.length,
				cachedFiles: urls.filter((url) => keys.has(url)).length,
				bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0)
			});
		})());
	});
})({"base":"/life-rpg-play/","version":"d5a3dee53df389771ac486b5","assets":[{"path":"/life-rpg-play/assets/AbilitySources-Bu3fnocd.js","digest":"f7e5215ea6790f6257b8758e0ae52e9805245f93c8cb563bb8c0ad022c89847e","bytes":23482},{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/Adventure-BBHnR8xk.css","digest":"fffda1044f80173ecbf92dbcb6cecf30f7b47ff16e15dec85bfa88b25b18511e","bytes":43375},{"path":"/life-rpg-play/assets/Adventure-CXOWPFuH.js","digest":"a6e2f95c681589be3c4911e7edc867f1c9b83dd3bb57d0cf3b42441ffede7573","bytes":247211},{"path":"/life-rpg-play/assets/companion-dawn-state-Dxxs1uow.js","digest":"acadaa8d3970cb288f41d3c417b445c7732d9f321ba87480ed9a648eab0a1b16","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-B2rEZstO.js","digest":"44c57d4060460abdc978370c6d1ca7dd5595a5f9331ebfb205a128a5b11d953c","bytes":4887},{"path":"/life-rpg-play/assets/companion-watch-journal-DIksJi7f.js","digest":"3aecfb4c16a6606fdf8013aff61df70f74f33472d6a81249497a1ebf22a6a6ac","bytes":66956},{"path":"/life-rpg-play/assets/companion-watch-meta-DtNdws0A.js","digest":"880229e778b3c6d9f3ebfdee1e935c8dcd802645eb1eca4690e527a9fc0cd30c","bytes":2813},{"path":"/life-rpg-play/assets/companion-watch-state-DfveqyE5.js","digest":"c7894c5ef281508364f126719db454da6cb858bdd3546703581015d19fde0aaf","bytes":5924},{"path":"/life-rpg-play/assets/CompanionPresence-Bb0a_GkA.js","digest":"86b91cd2b9d53e528a183492d14dad99bc9685601a6e73fd6e83cc6824987219","bytes":3349},{"path":"/life-rpg-play/assets/CompanionRememberedWords-CvOLiOOF.js","digest":"77d33928451213d029ac98eea1b0470a257dc071bdb429711fba0bfd8548a595","bytes":3039},{"path":"/life-rpg-play/assets/DailyPlanDialog-RGA3P2Tc.js","digest":"bcdc3feff29554966cf7d641c9e0e9a78f30cc9c1cfd61d466d60afbe4649ca6","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-DDhUFXHG.js","digest":"2e0199bd758a90cbb6566d158a32b021762097f79e1635de547835398a03ae95","bytes":23240},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-6PFbh-Nm.js","digest":"9d39f22c1d1d913c2f9dee8e17e1d9aaabb21d7f242de68b4f9291436f7bf538","bytes":8621},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/Growth-TPDjpUB6.js","digest":"816de4b7a9ffddfc8d60e01c55b39fa7d1a740ad890424c373030e3bb0a2c920","bytes":26033},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/GrowthOpportunity-DUgdbGwv.js","digest":"879cb6b4c391c2c513ac442b1f240cbe1699b7757ef8be16d1a870de41a4cc79","bytes":42420},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-DcH-N-qv.js","digest":"b4c67d8f8a9461f339b554b600bfe4e402571ccbe62f9b4f9866e127f7ea7fa3","bytes":106248},{"path":"/life-rpg-play/assets/GuidanceEditor-hEFB6-c3.css","digest":"506e0160bcbebde5d37ceeda1a92383ba9c426944765bc61aba4e50eaf27c776","bytes":7412},{"path":"/life-rpg-play/assets/HabiticaImport-BAuuAhc3.js","digest":"872fecd5b9fd21617389b6be66c30fbc27240f760942cbbead5ca3f7162a23b7","bytes":12351},{"path":"/life-rpg-play/assets/HabiticaImport-CpZ6rig5.css","digest":"57ecd85f6e1216235c8a4e52c68eda4651a56339b4e94238400671e6cbde3ee5","bytes":832},{"path":"/life-rpg-play/assets/index-BvT2t4XE.css","digest":"fa533896aea1808c5a9fd0047ad46f270e3ff89252dd83eba5e9e8ef1c14ed84","bytes":60372},{"path":"/life-rpg-play/assets/index-DqjyZh3k.js","digest":"920f62ea1caee169c364bd04e14e8e5973570a248adea238b546f16b5bcc5f6a","bytes":562847},{"path":"/life-rpg-play/assets/LocalConditionClues-C0jDX-SK.js","digest":"5e7fed2e18f55462482313f51fc55ffc7cf0ea116f14047d877bb2320f1a3fe4","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-DFhNzHST.js","digest":"3a8a533be6d7662690b9dbc43f181626e7fe0f24d24648ba550056d44f6bc9aa","bytes":1555},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/model-TntchJ9f.js","digest":"53d9aae7f148b64623ba59f83c84f54d6cf3f0839ad71a7f36de391c93e7deb4","bytes":61172},{"path":"/life-rpg-play/assets/QuickCaptureEditor-BCdqmGO6.js","digest":"89c00c77bed12c5f4539dfec377b698676acc12920d9d8fac6e32732cac6d3bb","bytes":16499},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/RecordRecovery-BoKNLiDH.js","digest":"d47f5c6c533a932bcc2dfa9d030cac0d5f77ba10a20fc7ab476ac617bac5d92e","bytes":4975},{"path":"/life-rpg-play/assets/save-BCWCaKOc.js","digest":"99c73a541a3c528205aa1aa2a2e339728dbda2d4ae6a29dcb5ea71240cb9d100","bytes":317},{"path":"/life-rpg-play/assets/schemas-CApDvOU8.js","digest":"54e72bca304fc98df768c6e47d92473f8b7609f1bd5173d4215d5543bf901ab2","bytes":87492},{"path":"/life-rpg-play/assets/starter-method-state-DTzdQBMr.js","digest":"8786421726caff386cddeedf87556d0fe361bb6c0e054f66ebf8aa4a1d3d6788","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-BKj_Yzqa.js","digest":"3615c57fdb8f40cac4d96031fb75d38154b987922fb8b710648540eace8dc42c","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-DQQzr8yN.js","digest":"a849cb279265c7ddb72efa4f54a62390c3ccae0986e9fb7ec3470925d2727dc6","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-CIl7CUHs.js","digest":"76566b4a9f38ead4546ef18e87dab5ffcad82070abb57a1b3bd3d7b2d0795fd5","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/StepCaptureEditor-BsVo2RkF.js","digest":"4109bff7d58f843fbfa339f0d5383b8d514fde65145b492aa884f9f79dc8a80f","bytes":15468},{"path":"/life-rpg-play/assets/ui-runtime-k-0UFiBe.js","digest":"2366f6b65a5e66e65fa2967704474030e85cb64dbee8ef6f726f25232512ee56","bytes":218824},{"path":"/life-rpg-play/assets/WatchPlan-BsOCsHN_.js","digest":"8c3e107aaf0de15e7ee4d239bf65513e85fff41b4979c17af55ecb9e16de4d9d","bytes":5558},{"path":"/life-rpg-play/index.html","digest":"aa55174765ba70ad578804479ba26960e086d134b0e903f201db1f1aa45e059e","bytes":1399}]});
