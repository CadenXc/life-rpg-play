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
})({"base":"/life-rpg-play/","version":"6f9636c297c43ca88f87d5d6","assets":[{"path":"/life-rpg-play/assets/AbilitySources-Cit5CNYh.js","digest":"828d78df3e9bfd21dfd0fc9ea35e8419c0bc3afaa9d370c9b8d38348f599988e","bytes":22099},{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/Adventure-BR3UyUf9.css","digest":"9425ee46ab23ab4051b10363f3e485165753bd0391880b0246929d344c2ce0a8","bytes":41416},{"path":"/life-rpg-play/assets/Adventure-Dj5KWqkL.js","digest":"d48e313697fea847eb9ac0f906a807b39c864947213a225c71594f5764d25918","bytes":231410},{"path":"/life-rpg-play/assets/companion-dawn-state-jVogSISM.js","digest":"2fede990c557e2f608eea27257dd57014de0f6a78c1cef7cd77ef1592c75b546","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-journal-BX4c6CyN.js","digest":"18c701795d5d172607f859b219cae7d0e02682e830936f28251bf50bda196ec3","bytes":53041},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-DoiJe0Mv.js","digest":"074ef8d1bf0f56ee4c19aa31d5e014b60cca35eb7878bec7f802bb9e5240abdd","bytes":4887},{"path":"/life-rpg-play/assets/CompanionPresence-_rmZqaq2.js","digest":"42199f5d9b5497887d0d24a5a82bdc730af8c22985625eb4cd64d04aa1121499","bytes":2966},{"path":"/life-rpg-play/assets/CompanionRememberedWords-DG8S2kci.js","digest":"c97699cced161c2a55468a6485e0daa93a886be5da9041e059441f71498b2265","bytes":2724},{"path":"/life-rpg-play/assets/DailyPlanDialog-NVDkR3B0.js","digest":"f4089f4fb41d7164710fc2a4a066ced9ed812f32ab887de6e1c0edb9384a6b69","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-BcwRAf6b.js","digest":"9585471925dc33d4ee9b95ddb1033660181b093766da4f5a88eab67097d4c592","bytes":23267},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-r42aAZLV.js","digest":"db527c9185e571f08f487da23a245d86af49b1e346ca8cb59d0ca4035c6039ab","bytes":8621},{"path":"/life-rpg-play/assets/Growth-BnKEu1RF.js","digest":"ada7907554efc0c93624ce9e843e5b394778b592cf1abf306775f547126459a3","bytes":26058},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/GrowthOpportunity-rg8sKQst.js","digest":"b32ba2c7fe35152e9661809b1682beeff8a65bda86535cbc3e41caf8d9492d6a","bytes":41948},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-Bk6BlCxG.css","digest":"bfe5be850b05df64a696618f0d8854e82742fd8bb5cc0e979723c440e0264682","bytes":5072},{"path":"/life-rpg-play/assets/GuidanceEditor-Cd03kha4.js","digest":"dfe8de0beb5e23a2070a372c6ff00bf28f9d81efd399f9edb45b9f6b516e0bdb","bytes":110004},{"path":"/life-rpg-play/assets/index-B4_tAyRp.css","digest":"c4d8766cbd3a9b467009dd6ddffaa57e449f3f91bb823b9d11df52fd940131b0","bytes":51582},{"path":"/life-rpg-play/assets/index-PldrJfAd.js","digest":"e4b926d88d1a7e1db201a3b338d8795bf3c86ca8d82034bc4f095b62c004a58f","bytes":518066},{"path":"/life-rpg-play/assets/LocalConditionClues-c3KFrczH.js","digest":"6260fda19985f62b446006317067c2cccdfa353b211720a13b133ab8033c2369","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-8NVuNr2D.js","digest":"1ab27d6766e28a09328b2d741dbac2a9b70766436c37230fc52c871d4721f3fe","bytes":1578},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/model-D_AkzfTJ.js","digest":"8e11414e88275700bf183740aef34a189f6c1575eba105f5a6e699aa3eb99277","bytes":57942},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/QuickCaptureEditor-x-07ZDOH.js","digest":"d5151a96625aca9a34aeaf8891bada760572ff6c4ca53841a73c0f2d1a54f6ab","bytes":16494},{"path":"/life-rpg-play/assets/RecordRecovery-D5z6-Q_o.js","digest":"384a8206b76d76322759078d083deeac0f3ddd01bc12aa393de09709c4f501d8","bytes":4975},{"path":"/life-rpg-play/assets/save-DzJTxvCm.js","digest":"9678b3248b24669dced6a1c5dd9dd93fe82be4c3dbde8cd9c19c7415d09e7efe","bytes":312},{"path":"/life-rpg-play/assets/schemas-n9i_8l1c.js","digest":"28086dfeddb9f1dc0f6ca2573ea0e390f89813e1f15d78dc2ad1fca274e525cb","bytes":87361},{"path":"/life-rpg-play/assets/starter-method-state-DDyj-3RQ.js","digest":"0ac63ca5868dc54cf01704c1aa956894cc6e7f5bed5cc1b6f6e8f51938b77435","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-DRw8tz8l.js","digest":"67f19e6fefd2de858ebb638b5d0b5ec6ec3c13b6b560a1e827616950b7ca7eb7","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-Cv73R5Q2.js","digest":"826c3fa9db6654a56e1c37fc36a5d28f5e5ab16143e11168dbd3a32ae302a799","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-BUZcCNpQ.js","digest":"11460e181568f9e824da8162a654fe1413eda565dc64ac511dd5c2f607ff7c02","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/StepCaptureEditor-pIxclzIp.js","digest":"ed09cc5733b876b912659bf8ebba0f33f3ebbfff48fe1ee9a99fe1dc5f417463","bytes":15468},{"path":"/life-rpg-play/assets/ui-runtime-Dg0PunWK.js","digest":"d91f2fcf6d7ea5e0ad6388d0ffc24581af386931031cf215f136a0c17ee3cd86","bytes":218824},{"path":"/life-rpg-play/assets/use-dialog-focus-_gvHfI_d.js","digest":"21b75bbd62468dddcf2afb07da890a40a44f4fa750540500e0d96babe2fcc028","bytes":436},{"path":"/life-rpg-play/assets/x-CchUc5zq.js","digest":"fbffeafc0b316fd504474c2cb8d203613ec224913fe5413246f0179b16f3614b","bytes":1038},{"path":"/life-rpg-play/index.html","digest":"1406400f29c28e4465279e1d873ba09ae90d3afb33a812c95e82ab34b9343b29","bytes":1375}]});
