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
})({"base":"/life-rpg-play/","version":"717db10925d9783c685c491a","assets":[{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/AbilitySources-Dw9mYZaG.js","digest":"65174b7435d035cb53e6f624ed7ee6a1742cb3704e360602a6b106236e8d7592","bytes":22099},{"path":"/life-rpg-play/assets/Adventure-B1NIlVjE.js","digest":"ce9cac0ff11a86545151022f791e4dbd7671049d7a64dde6c85d3a7b7c580ef0","bytes":231410},{"path":"/life-rpg-play/assets/Adventure-BR3UyUf9.css","digest":"9425ee46ab23ab4051b10363f3e485165753bd0391880b0246929d344c2ce0a8","bytes":41416},{"path":"/life-rpg-play/assets/companion-dawn-state-jVogSISM.js","digest":"2fede990c557e2f608eea27257dd57014de0f6a78c1cef7cd77ef1592c75b546","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-journal-BNKMHiaI.js","digest":"ab1b07e649285c4613e8c5a442e656bd5bddd7b15229078547340915b09b50c3","bytes":53041},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-DoiJe0Mv.js","digest":"074ef8d1bf0f56ee4c19aa31d5e014b60cca35eb7878bec7f802bb9e5240abdd","bytes":4887},{"path":"/life-rpg-play/assets/CompanionPresence-DNhvCLdm.js","digest":"5c06fd69285aae39f6050f0c58ee33058fcfb26fb5b84cc8c10a0717fd28a9ff","bytes":2966},{"path":"/life-rpg-play/assets/CompanionRememberedWords-hqu5VU8-.js","digest":"7505208e21d7ecabb9f0b043a76533e5fe4def900dd2415491e85511594ae09b","bytes":2724},{"path":"/life-rpg-play/assets/DailyPlanDialog-DQ2azt_K.js","digest":"119c8a9a36f2543b4247b8483a82800d325ab9ec040e0c169ff288a6f4bf0c8c","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-a0ics9P7.js","digest":"cab989b0fa3259104eb74ea9fb91ae896a16c5a4212937d4ed41a799c6c0ec1b","bytes":23267},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-BNXZBIER.js","digest":"e37b6600972389f8a01ef72607e1728a7e5395e95609b09be6a0df9c6c1ad53a","bytes":8621},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/Growth-Hfm3poiX.js","digest":"4a71b1d4cf92d384b124b997e77a5288cd978d0a77c931956368d4ac3d571499","bytes":26058},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/GrowthOpportunity-D1oHzvae.js","digest":"34dfc1030e775c34f327f9abc56a7950c4a52c3bf7798416b68e6ffa5fbb703e","bytes":41948},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-7zXErbSd.js","digest":"8dd7457548e6f6472c701e45dc636c584f3306a75ed463160703e9897c3e5810","bytes":110282},{"path":"/life-rpg-play/assets/GuidanceEditor-Bk6BlCxG.css","digest":"bfe5be850b05df64a696618f0d8854e82742fd8bb5cc0e979723c440e0264682","bytes":5072},{"path":"/life-rpg-play/assets/index-B4_tAyRp.css","digest":"c4d8766cbd3a9b467009dd6ddffaa57e449f3f91bb823b9d11df52fd940131b0","bytes":51582},{"path":"/life-rpg-play/assets/index-BCAo6Nau.js","digest":"76fa465fc04f1f89db5333ef54466ce2443f5c2431b72f775b32cb422dd14eae","bytes":518066},{"path":"/life-rpg-play/assets/LocalConditionClues-DoFgXQ-2.js","digest":"0383c5dae6d185518aeb37377a27b0601bc4184bb416f857a98b371c32727745","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-0cuexvJg.js","digest":"d1e50fbd267b785a5ee453ac0f806c38605b1890f6587f272508b2966753a624","bytes":1578},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/model-D_AkzfTJ.js","digest":"8e11414e88275700bf183740aef34a189f6c1575eba105f5a6e699aa3eb99277","bytes":57942},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/QuickCaptureEditor-s9gCvXOj.js","digest":"09a0612ce8b9fef6a6ae4e0734cd72bb72d681326a391225dfb57b5a14843a99","bytes":16494},{"path":"/life-rpg-play/assets/RecordRecovery-BP-M54Ha.js","digest":"a133eb2927190a15d8366e6f05986573525df7b7a338728f907504663434615a","bytes":4975},{"path":"/life-rpg-play/assets/save-DzJTxvCm.js","digest":"9678b3248b24669dced6a1c5dd9dd93fe82be4c3dbde8cd9c19c7415d09e7efe","bytes":312},{"path":"/life-rpg-play/assets/schemas-n9i_8l1c.js","digest":"28086dfeddb9f1dc0f6ca2573ea0e390f89813e1f15d78dc2ad1fca274e525cb","bytes":87361},{"path":"/life-rpg-play/assets/starter-method-state-DDyj-3RQ.js","digest":"0ac63ca5868dc54cf01704c1aa956894cc6e7f5bed5cc1b6f6e8f51938b77435","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-DRw8tz8l.js","digest":"67f19e6fefd2de858ebb638b5d0b5ec6ec3c13b6b560a1e827616950b7ca7eb7","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-AMT_8oCo.js","digest":"04c5c27134f2cb654a58352de4eda4a62c8b3f9ed993f5f42420c3fdf7813419","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-CTjihMbc.js","digest":"f17b911443675f9692cf769723d6819d9653b48a8efc31d8d98e4d9aac223c2c","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/StepCaptureEditor-DxHE9XS2.js","digest":"a3bdc6da4882a73037ecec270c22a80ae74ffaf782f9ca0a2e5bac80441b9bf2","bytes":15468},{"path":"/life-rpg-play/assets/ui-runtime-Dg0PunWK.js","digest":"d91f2fcf6d7ea5e0ad6388d0ffc24581af386931031cf215f136a0c17ee3cd86","bytes":218824},{"path":"/life-rpg-play/assets/use-dialog-focus-_gvHfI_d.js","digest":"21b75bbd62468dddcf2afb07da890a40a44f4fa750540500e0d96babe2fcc028","bytes":436},{"path":"/life-rpg-play/assets/x-CchUc5zq.js","digest":"fbffeafc0b316fd504474c2cb8d203613ec224913fe5413246f0179b16f3614b","bytes":1038},{"path":"/life-rpg-play/index.html","digest":"2a70bd992d7f07502ea5158de78a986992965f012ea54005ad3951df0d29b74b","bytes":1375}]});
