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
})({"base":"/life-rpg-play/","version":"8d79a25e821e673d349287b7","assets":[{"path":"/life-rpg-play/assets/AbilitySources-CKJObyLe.js","digest":"0b7ef501ff351cd92d58bfc6d4013ca51d24dd9b4ba8624fdcdf407a8ea2a95a","bytes":22099},{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/Adventure-BR3UyUf9.css","digest":"9425ee46ab23ab4051b10363f3e485165753bd0391880b0246929d344c2ce0a8","bytes":41416},{"path":"/life-rpg-play/assets/Adventure-QDd1TXAw.js","digest":"ef3c26c70255f507b4e7c87b7c90c11a4d128a92b58381410f1c4c378e60f581","bytes":231410},{"path":"/life-rpg-play/assets/companion-dawn-state-jVogSISM.js","digest":"2fede990c557e2f608eea27257dd57014de0f6a78c1cef7cd77ef1592c75b546","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-journal-Dia0fPTA.js","digest":"9d9a1e8a7638c7aa863afbaab6bebafddf9612761f0a73bbd9e5e261a8734c03","bytes":53041},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-DoiJe0Mv.js","digest":"074ef8d1bf0f56ee4c19aa31d5e014b60cca35eb7878bec7f802bb9e5240abdd","bytes":4887},{"path":"/life-rpg-play/assets/CompanionPresence-D3Yasrc6.js","digest":"29ae4e6bbece4e760108f2269614916fce52b853c3f545e572d1c9cb0381ef9c","bytes":2966},{"path":"/life-rpg-play/assets/CompanionRememberedWords-BkaFlXTX.js","digest":"3aaa7a99af58201f5ce8397718a09ade88e59c46d67c04adc7b433e7d70607da","bytes":2724},{"path":"/life-rpg-play/assets/DailyPlanDialog-6g8oKFwJ.js","digest":"a69bb50f04cb3eaa31c0a13308d0f561f90791cbd22dec59a6c9097b67f67335","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-BYI1iwsD.js","digest":"823520d3e6d02a02b382781b95c1909d2920078d9e34840dbf1b06943ee05837","bytes":23267},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-DF0P_-1s.js","digest":"e1a311c8df65166151c4badfa06f41a3d8ec6688423d4dbbdf067a422459bdbe","bytes":8621},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/Growth-CGkWZEPp.js","digest":"fce25d43102c552bbc4cf3017ffd2991360a5c09b526746ffb9863a71b826e2a","bytes":26058},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/GrowthOpportunity-DBAkzdrX.js","digest":"e1e8509ced773dc3a83f4b65fb7cb9c868d195877404cd20e16c659ae4600560","bytes":41948},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-Bk6BlCxG.css","digest":"bfe5be850b05df64a696618f0d8854e82742fd8bb5cc0e979723c440e0264682","bytes":5072},{"path":"/life-rpg-play/assets/GuidanceEditor-CENZ6M1X.js","digest":"f41b60e7d2477ec4203bdd2df8b6ea13fe616485a5f3e1c45810b31bf2f7736f","bytes":103466},{"path":"/life-rpg-play/assets/index-B4_tAyRp.css","digest":"c4d8766cbd3a9b467009dd6ddffaa57e449f3f91bb823b9d11df52fd940131b0","bytes":51582},{"path":"/life-rpg-play/assets/index-CVVbs18j.js","digest":"df3511df5fd364ba7b8b7edf0139c3b05f18b513f68b77140f2ba3856f6c861c","bytes":518045},{"path":"/life-rpg-play/assets/LocalConditionClues-DtlwsymU.js","digest":"254a910b6dfb0252cb7f69d212a455423ed4e859e17b91e86c441ddb4fe97128","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-BjFVTMrh.js","digest":"506c50d44c39352e48134ccaa3929d5a7b5297dc7d61da4a0d329371312229ba","bytes":1578},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/model-D_AkzfTJ.js","digest":"8e11414e88275700bf183740aef34a189f6c1575eba105f5a6e699aa3eb99277","bytes":57942},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/QuickCaptureEditor-tpmZ4vwv.js","digest":"c5bf234b55005862ddc2f2e3c261a2ea096118b1ad919d1b99a9aa2dc5a24af4","bytes":16494},{"path":"/life-rpg-play/assets/RecordRecovery-BNHkbIGB.js","digest":"25135fd5f81a55d0a9d3475db6c0e2159743624160582d2b7ecfe717762b1dd5","bytes":4975},{"path":"/life-rpg-play/assets/save-DzJTxvCm.js","digest":"9678b3248b24669dced6a1c5dd9dd93fe82be4c3dbde8cd9c19c7415d09e7efe","bytes":312},{"path":"/life-rpg-play/assets/schemas-n9i_8l1c.js","digest":"28086dfeddb9f1dc0f6ca2573ea0e390f89813e1f15d78dc2ad1fca274e525cb","bytes":87361},{"path":"/life-rpg-play/assets/starter-method-state-DDyj-3RQ.js","digest":"0ac63ca5868dc54cf01704c1aa956894cc6e7f5bed5cc1b6f6e8f51938b77435","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-DRw8tz8l.js","digest":"67f19e6fefd2de858ebb638b5d0b5ec6ec3c13b6b560a1e827616950b7ca7eb7","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-EEH_dgN4.js","digest":"d1fd4544295c0341711328012199db9a5c6ba31b02096ecb9e4b33a565805972","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-D3p1GFQp.js","digest":"def33f44d478ef5c7346d3284903c958061979e5faac7cd6547a89dfadbf2d79","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/StepCaptureEditor-D651zaxI.js","digest":"1f4c6859c2855f90416e8e4994c6d5270e0d56895c272f4ec86ee75c44bf4fa2","bytes":15468},{"path":"/life-rpg-play/assets/ui-runtime-Dg0PunWK.js","digest":"d91f2fcf6d7ea5e0ad6388d0ffc24581af386931031cf215f136a0c17ee3cd86","bytes":218824},{"path":"/life-rpg-play/assets/use-dialog-focus-_gvHfI_d.js","digest":"21b75bbd62468dddcf2afb07da890a40a44f4fa750540500e0d96babe2fcc028","bytes":436},{"path":"/life-rpg-play/assets/x-CchUc5zq.js","digest":"fbffeafc0b316fd504474c2cb8d203613ec224913fe5413246f0179b16f3614b","bytes":1038},{"path":"/life-rpg-play/index.html","digest":"e4056ee9f3b73c5a0ac764e0d464b4bd9e94c97c7ea6c033640f04add6bdcf8c","bytes":1375}]});
