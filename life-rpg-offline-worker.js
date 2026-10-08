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
})({"base":"/life-rpg-play/","version":"1b599b355a4105c4737ba4ec","assets":[{"path":"/life-rpg-play/assets/AbilitySources-CqVdsZzg.js","digest":"c3d14c0ddbd5803f102d1fea6f8aab035fef6681e5d8e1b8d3f6fd15c814bd9f","bytes":23482},{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/Adventure-BBHnR8xk.css","digest":"fffda1044f80173ecbf92dbcb6cecf30f7b47ff16e15dec85bfa88b25b18511e","bytes":43375},{"path":"/life-rpg-play/assets/Adventure-By3Rx571.js","digest":"3e93f06da6632319d08c4df9b408b63b6c91e1445e654982daea72b531fed568","bytes":247211},{"path":"/life-rpg-play/assets/companion-dawn-state-Dxxs1uow.js","digest":"acadaa8d3970cb288f41d3c417b445c7732d9f321ba87480ed9a648eab0a1b16","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-B2rEZstO.js","digest":"44c57d4060460abdc978370c6d1ca7dd5595a5f9331ebfb205a128a5b11d953c","bytes":4887},{"path":"/life-rpg-play/assets/companion-watch-journal-6f2jye6e.js","digest":"fc723214674e29fadda53e5d5e2744a29c4681e2d4cb002fc8052e0d8df0be9a","bytes":66956},{"path":"/life-rpg-play/assets/companion-watch-meta-DtNdws0A.js","digest":"880229e778b3c6d9f3ebfdee1e935c8dcd802645eb1eca4690e527a9fc0cd30c","bytes":2813},{"path":"/life-rpg-play/assets/companion-watch-state-DfveqyE5.js","digest":"c7894c5ef281508364f126719db454da6cb858bdd3546703581015d19fde0aaf","bytes":5924},{"path":"/life-rpg-play/assets/CompanionPresence-D3j0oUVo.js","digest":"4f312145bb575d83a29195e0815a0685aa9281e82ebda7815045270b937745fe","bytes":3349},{"path":"/life-rpg-play/assets/CompanionRememberedWords-CARWWVHf.js","digest":"cd5deb73eafce7298a939f5f77845cebe11594ffb43af2e4cb64ed18aceaf50c","bytes":3039},{"path":"/life-rpg-play/assets/DailyPlanDialog-FOJyJrJg.js","digest":"dfa1ce1e20f639356850a231eab7ff3d795c39d25828d50663ef0bb2f033c4d8","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-CRCe5f4a.js","digest":"6aa278bcdd6a0aae5058ec3753d3d1048e0f63a428451f9e27eece9de6dae54e","bytes":23240},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-CmrmxDo3.js","digest":"10730f354e4672accb5f4ffb486e9cc0c97e50b27e2aa07f00da43bc0d5c35e0","bytes":8621},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/Growth-By_uQkXa.js","digest":"2d07863c5eee4333d89e4d4be18e14b551729278321311962e07981ea444d1ca","bytes":26033},{"path":"/life-rpg-play/assets/GrowthOpportunity-B5_suqcs.js","digest":"905c5cc0b4c587e14cd34c9287544ef0873c91dc3e9b8135aa8fc5466cf53bcd","bytes":42420},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-CfeEt_lR.js","digest":"32ed31002fc74903da0e23717e944a011fd9d1b35491404ce27fa6c5af7e3d52","bytes":108732},{"path":"/life-rpg-play/assets/GuidanceEditor-hEFB6-c3.css","digest":"506e0160bcbebde5d37ceeda1a92383ba9c426944765bc61aba4e50eaf27c776","bytes":7412},{"path":"/life-rpg-play/assets/HabiticaImport-CpZ6rig5.css","digest":"57ecd85f6e1216235c8a4e52c68eda4651a56339b4e94238400671e6cbde3ee5","bytes":832},{"path":"/life-rpg-play/assets/HabiticaImport-D4OVSjLE.js","digest":"d010484ebbff0ffb2a2b04f88fe363ada6da534d4354ff09937ba9e65ae1c1bc","bytes":12351},{"path":"/life-rpg-play/assets/index-BlK-c1GE.js","digest":"1136eb58442c621ae7e18e5697fc2b1ad25b550be38e087b5a94b841f75df39b","bytes":550120},{"path":"/life-rpg-play/assets/index-C1T8n32b.css","digest":"b6e0a22b755ace08e8f93dac0c148ea51d491345a7244f5c5aed4a74dc7a96ab","bytes":58115},{"path":"/life-rpg-play/assets/LocalConditionClues-DfaPURH-.js","digest":"9d462546fd9c396178dc16a515803a5bbedfe7938e2fbee51919cd9332ad8cff","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-DrVtfEoh.js","digest":"bb718b34536853973e479a7368fd88205296178836915f628d2ea956d209a1bd","bytes":1555},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/model-TntchJ9f.js","digest":"53d9aae7f148b64623ba59f83c84f54d6cf3f0839ad71a7f36de391c93e7deb4","bytes":61172},{"path":"/life-rpg-play/assets/QuickCaptureEditor-DsgqCdd1.js","digest":"582bab42b3cbd995f6523bc897a3e1c5a1316e3da61e72bbc35ebc211a3089f6","bytes":16499},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/RecordRecovery-Bvp4eNr5.js","digest":"db06c572b725836b620a78028ab79b4ce8ce2ee314e942852cb25a4443c65c37","bytes":4975},{"path":"/life-rpg-play/assets/save-EveCboRP.js","digest":"f3f6cb502b5797555c089f4261d7060a054422dc115aaa41d6b80c5501182913","bytes":317},{"path":"/life-rpg-play/assets/schemas-CApDvOU8.js","digest":"54e72bca304fc98df768c6e47d92473f8b7609f1bd5173d4215d5543bf901ab2","bytes":87492},{"path":"/life-rpg-play/assets/starter-method-state-DTzdQBMr.js","digest":"8786421726caff386cddeedf87556d0fe361bb6c0e054f66ebf8aa4a1d3d6788","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-BKj_Yzqa.js","digest":"3615c57fdb8f40cac4d96031fb75d38154b987922fb8b710648540eace8dc42c","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-AngDcrZY.js","digest":"2226efeb68bf54ef72c0c0c503258f6a8a1122f4e337ff74dd0a55cc2fe70e7d","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-xsM8RrRS.js","digest":"bd8889dee620d92125e71b2c00ce859c4fe236d7f1a4c90b296644d67ccb5d29","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/StepCaptureEditor-BTSDrqAO.js","digest":"254d0f2305eda5e7d5f6f9caad380695193b01225fd58f69dfa2be143022b057","bytes":15468},{"path":"/life-rpg-play/assets/ui-runtime-k-0UFiBe.js","digest":"2366f6b65a5e66e65fa2967704474030e85cb64dbee8ef6f726f25232512ee56","bytes":218824},{"path":"/life-rpg-play/assets/WatchPlan-kJSRjU0_.js","digest":"4196f908b64ecbb240a0b8f889bfbe9b77017c1aa3efe8389726f54544d785bd","bytes":5558},{"path":"/life-rpg-play/index.html","digest":"4c5f04eff752ad6cc488fd6460164d3efe63a94f1c10c191fbd9731120d5f3e5","bytes":1399}]});
