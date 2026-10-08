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
})({"base":"/life-rpg-play/","version":"b9df7f1031e451f21cf33b9d","assets":[{"path":"/life-rpg-play/assets/AbilitySources-ChVhZQoc.js","digest":"6c00691b6457f2af60ea41e4a83c684f891041a11743ba76f5752a791fa2b67e","bytes":22099},{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/Adventure-BLnp_kET.js","digest":"41f0e32b5b82f862619c2c423a41971ea6409f7430dfe90ba1a2f55baf242fff","bytes":231409},{"path":"/life-rpg-play/assets/Adventure-BR3UyUf9.css","digest":"9425ee46ab23ab4051b10363f3e485165753bd0391880b0246929d344c2ce0a8","bytes":41416},{"path":"/life-rpg-play/assets/companion-dawn-state-jVogSISM.js","digest":"2fede990c557e2f608eea27257dd57014de0f6a78c1cef7cd77ef1592c75b546","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-journal-DAsKeoaH.js","digest":"9a1eeb1ddc7e0f1454704c3f1a8f46dfb5d86a222a0492d9ec78ff1170ac5760","bytes":53041},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-DoiJe0Mv.js","digest":"074ef8d1bf0f56ee4c19aa31d5e014b60cca35eb7878bec7f802bb9e5240abdd","bytes":4887},{"path":"/life-rpg-play/assets/CompanionPresence-BTcU6vEU.js","digest":"1fdac7674b127db85f82606fdd0ec6da16d1c782e5e84b43945fc11a93754266","bytes":2966},{"path":"/life-rpg-play/assets/CompanionRememberedWords-SoILXu7Q.js","digest":"171cac63a1630cf19a0abfca3a12c3fab008fb963b3b5567c782357b0d35ebe9","bytes":2724},{"path":"/life-rpg-play/assets/DailyPlanDialog-F02rZc_w.js","digest":"e55972844eecfa525079f61ff22a1fd210cc36fe82ba3904fc1378ea6bf832bc","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-COl4lsM0.js","digest":"d3a2f986b2cf5cc51660518ddf6bd404b871dfbe2816bc0ddbffec4b079d3134","bytes":23267},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-DxE7NHTv.js","digest":"76891382ddc352012ae9f068fce1ac92f29316167cfe6fd8ff9c452cd094700f","bytes":8621},{"path":"/life-rpg-play/assets/Growth-BhPAe6Sz.js","digest":"89df72cceff2f6880195bad24aa340ba16e7b6c695459229d9c6eda3b932fdc1","bytes":26058},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/GrowthOpportunity-CFoXv1dR.js","digest":"7037b248ad1758a5bb744515ed5b55b75ba365f16b7ca31ecf92b3b550ffe93d","bytes":41948},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-Bk6BlCxG.css","digest":"bfe5be850b05df64a696618f0d8854e82742fd8bb5cc0e979723c440e0264682","bytes":5072},{"path":"/life-rpg-play/assets/GuidanceEditor-DKhKVKk9.js","digest":"1b066e9a82e1e5c00df1d5bc4fd558103335727d1488d9bb19e697687b6318b7","bytes":107904},{"path":"/life-rpg-play/assets/index-8sJK8PVu.js","digest":"ed351b43865152ec00b1b1402c4136d42651b0fa860aab7d1ce416616a38daf6","bytes":522625},{"path":"/life-rpg-play/assets/index-B4_tAyRp.css","digest":"c4d8766cbd3a9b467009dd6ddffaa57e449f3f91bb823b9d11df52fd940131b0","bytes":51582},{"path":"/life-rpg-play/assets/LocalConditionClues-XxqZfA2k.js","digest":"32554f08b308311c04a8f845629ffa13320feda123864486dffa380c1694dc25","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/MilestoneFeedback-uzteJ-kI.js","digest":"2ec19fa854a9e463d866ef256ebaa1d4aaa12435dac9a21aceda447f04eb50d5","bytes":1578},{"path":"/life-rpg-play/assets/model-D_AkzfTJ.js","digest":"8e11414e88275700bf183740aef34a189f6c1575eba105f5a6e699aa3eb99277","bytes":57942},{"path":"/life-rpg-play/assets/QuickCaptureEditor-CabxPLcz.js","digest":"17ae1144a68f33f1064147db8272fd4cfbaac61a1c86056c1d4b60881fc465c1","bytes":16494},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/RecordRecovery-C_7TKG6K.js","digest":"3fadfd760585080c48088a60e424c75e36ece92db5a41d54e573b1373cda3f60","bytes":4975},{"path":"/life-rpg-play/assets/save-DzJTxvCm.js","digest":"9678b3248b24669dced6a1c5dd9dd93fe82be4c3dbde8cd9c19c7415d09e7efe","bytes":312},{"path":"/life-rpg-play/assets/schemas-n9i_8l1c.js","digest":"28086dfeddb9f1dc0f6ca2573ea0e390f89813e1f15d78dc2ad1fca274e525cb","bytes":87361},{"path":"/life-rpg-play/assets/starter-method-state-DDyj-3RQ.js","digest":"0ac63ca5868dc54cf01704c1aa956894cc6e7f5bed5cc1b6f6e8f51938b77435","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-DRw8tz8l.js","digest":"67f19e6fefd2de858ebb638b5d0b5ec6ec3c13b6b560a1e827616950b7ca7eb7","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-BOHCLB3Y.js","digest":"24bedbcb9122f3b31e9132649a3b920b5ee1f9c0972ecdd5fd681c43d8e0aca9","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-C04NF4P-.js","digest":"45654909c813a3d1a54defcfca3e4b9718d17c8395045f68d56f505a34b2fe6a","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/StepCaptureEditor-BeGBl4bo.js","digest":"8f5a74ed2aa3ca824cd29712693324043f5a64d517c05bb36014018f9f542433","bytes":15468},{"path":"/life-rpg-play/assets/ui-runtime-Dg0PunWK.js","digest":"d91f2fcf6d7ea5e0ad6388d0ffc24581af386931031cf215f136a0c17ee3cd86","bytes":218824},{"path":"/life-rpg-play/assets/use-dialog-focus-_gvHfI_d.js","digest":"21b75bbd62468dddcf2afb07da890a40a44f4fa750540500e0d96babe2fcc028","bytes":436},{"path":"/life-rpg-play/assets/x-CchUc5zq.js","digest":"fbffeafc0b316fd504474c2cb8d203613ec224913fe5413246f0179b16f3614b","bytes":1038},{"path":"/life-rpg-play/index.html","digest":"b962f79d69219bb428886a20e9d40f6191c58d32bf3d72457ae56ef47dc6f014","bytes":1375}]});
