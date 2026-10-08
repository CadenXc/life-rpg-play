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
})({"base":"/life-rpg-play/","version":"f08bc357381ce81d0abf340f","assets":[{"path":"/life-rpg-play/assets/AbilitySources-Bomwi70j.js","digest":"5ec125cd33bcffb7ec8cd592ebb8d4263844a89393ab4b205340c310afd4a47c","bytes":22099},{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/Adventure-BppocQ8Y.js","digest":"ad266e394db1e45f78ebfa3681904800e368404b2a33e2fe45e8eeeb63f936ab","bytes":231410},{"path":"/life-rpg-play/assets/Adventure-BR3UyUf9.css","digest":"9425ee46ab23ab4051b10363f3e485165753bd0391880b0246929d344c2ce0a8","bytes":41416},{"path":"/life-rpg-play/assets/companion-dawn-state-jVogSISM.js","digest":"2fede990c557e2f608eea27257dd57014de0f6a78c1cef7cd77ef1592c75b546","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-journal-DXKKmnnU.js","digest":"f5eac7c59e19ca04280ab5d95c971412db062865b0be17d51f1da661ff8b64a7","bytes":53041},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-DoiJe0Mv.js","digest":"074ef8d1bf0f56ee4c19aa31d5e014b60cca35eb7878bec7f802bb9e5240abdd","bytes":4887},{"path":"/life-rpg-play/assets/CompanionPresence-MI6V164K.js","digest":"ca96ba394fda34f57e80a637152bb5464457cf42b15e3208e6eaf26e12087add","bytes":2966},{"path":"/life-rpg-play/assets/CompanionRememberedWords-CjiJVE7a.js","digest":"cde196f832e82c81e2640d8ecc9b4942eeebe74a92802bc87653cd37fc5069b5","bytes":2724},{"path":"/life-rpg-play/assets/DailyPlanDialog-Mpcmhp-6.js","digest":"2569cde97c10e3b2f03c350d2404eb4a46e5cc22214378acc35ba4c5ff099f3e","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-CCxEwkLR.js","digest":"5d03e7838299acd91c6c7c29d97b78f5401c7b89311e95f2030593b082abb676","bytes":23267},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-BF_FvrJB.js","digest":"20cb5fcdf3dd5c4b24a416f4d831efacdad25dea97a942f8a0feb8c663222dc8","bytes":8621},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/Growth-Dy_K0I5n.js","digest":"78454a271d621d6fd01a05094d850e1b1e4b78159e6b9d96874b9a42d5159801","bytes":26058},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/GrowthOpportunity-xLNBCga6.js","digest":"a845b2b0a6fb02a929a9fddcf47dd97496500e9ec0ba2fa85cfaaa8958ee7668","bytes":41948},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-Bk6BlCxG.css","digest":"bfe5be850b05df64a696618f0d8854e82742fd8bb5cc0e979723c440e0264682","bytes":5072},{"path":"/life-rpg-play/assets/GuidanceEditor-wIIgHhHz.js","digest":"c6764ca528648547b85fff8b21123b0db1690687bbb7d2ae25907d775a9c3fb7","bytes":111587},{"path":"/life-rpg-play/assets/index-B4_tAyRp.css","digest":"c4d8766cbd3a9b467009dd6ddffaa57e449f3f91bb823b9d11df52fd940131b0","bytes":51582},{"path":"/life-rpg-play/assets/index-B5zyMCga.js","digest":"3382059c58484c89e468696d68714d6bc8d28bf16ac6c826a6ab2e6999834bc6","bytes":518066},{"path":"/life-rpg-play/assets/LocalConditionClues-CxyEgbdY.js","digest":"dc06f8e4ff3ae6d8f0f7e86e4d3279c1d72031d6f22ff19335e7e4226d6648a0","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-CWSb4qnn.js","digest":"94b3809299eb1abb101e42c23981fcb1ab689bbe66bc2a9e6ff0d511b3590321","bytes":1578},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/model-D_AkzfTJ.js","digest":"8e11414e88275700bf183740aef34a189f6c1575eba105f5a6e699aa3eb99277","bytes":57942},{"path":"/life-rpg-play/assets/QuickCaptureEditor-Bsd8l8B_.js","digest":"8ad05d271a039c41c37637a8ba5153dace2545aa7c06c550a30baf30ecca50ee","bytes":16494},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/RecordRecovery-BtZvP0CM.js","digest":"9d2939b356929a0f195c6a0f84acf67c73b64377902650940eb0b8e4634b0044","bytes":4975},{"path":"/life-rpg-play/assets/save-DzJTxvCm.js","digest":"9678b3248b24669dced6a1c5dd9dd93fe82be4c3dbde8cd9c19c7415d09e7efe","bytes":312},{"path":"/life-rpg-play/assets/schemas-n9i_8l1c.js","digest":"28086dfeddb9f1dc0f6ca2573ea0e390f89813e1f15d78dc2ad1fca274e525cb","bytes":87361},{"path":"/life-rpg-play/assets/starter-method-state-DDyj-3RQ.js","digest":"0ac63ca5868dc54cf01704c1aa956894cc6e7f5bed5cc1b6f6e8f51938b77435","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-DRw8tz8l.js","digest":"67f19e6fefd2de858ebb638b5d0b5ec6ec3c13b6b560a1e827616950b7ca7eb7","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-CFpOVWJJ.js","digest":"663ebf7b4f8c09f6bcaa513a41c635b30cb6c41b9c675a3607c2d56c110a3b84","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-BGWwjRZg.js","digest":"34e993d494af3f4ce987618771782702cd426185d26dfec47cf71dcb77a5c362","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-2Itel3oP.js","digest":"29817f0d9ad70f967c9fc07758c423e854e6b1f5b57992da8739bfc3e31f2e4f","bytes":15468},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/ui-runtime-Dg0PunWK.js","digest":"d91f2fcf6d7ea5e0ad6388d0ffc24581af386931031cf215f136a0c17ee3cd86","bytes":218824},{"path":"/life-rpg-play/assets/use-dialog-focus-_gvHfI_d.js","digest":"21b75bbd62468dddcf2afb07da890a40a44f4fa750540500e0d96babe2fcc028","bytes":436},{"path":"/life-rpg-play/assets/x-CchUc5zq.js","digest":"fbffeafc0b316fd504474c2cb8d203613ec224913fe5413246f0179b16f3614b","bytes":1038},{"path":"/life-rpg-play/index.html","digest":"5a0440421d14fa642d4eef8758bce1681133d18b7e74e94dc58a2f8a242ec01d","bytes":1375}]});
