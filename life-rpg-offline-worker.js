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
})({"base":"/life-rpg-play/","version":"7d6645aef12249e60aed3181","assets":[{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/AbilitySources-DFJU2xjw.js","digest":"0e2f4ad88ca9de81635df1d807b08a8779e79fdeae7162e46a11a704e7d5c829","bytes":23482},{"path":"/life-rpg-play/assets/Adventure-BBHnR8xk.css","digest":"fffda1044f80173ecbf92dbcb6cecf30f7b47ff16e15dec85bfa88b25b18511e","bytes":43375},{"path":"/life-rpg-play/assets/Adventure-BlMjoW5w.js","digest":"b22e94bcdb5d611c09d2514ac0a940414be7e4288e538d78536085acafaa7e19","bytes":247211},{"path":"/life-rpg-play/assets/companion-dawn-state-Dxxs1uow.js","digest":"acadaa8d3970cb288f41d3c417b445c7732d9f321ba87480ed9a648eab0a1b16","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-B2rEZstO.js","digest":"44c57d4060460abdc978370c6d1ca7dd5595a5f9331ebfb205a128a5b11d953c","bytes":4887},{"path":"/life-rpg-play/assets/companion-watch-journal-C0RRh1TR.js","digest":"1bd832af5d550763817737107d6aa13ee39c7290ad174e1f49877dbab354160c","bytes":66956},{"path":"/life-rpg-play/assets/companion-watch-meta-DtNdws0A.js","digest":"880229e778b3c6d9f3ebfdee1e935c8dcd802645eb1eca4690e527a9fc0cd30c","bytes":2813},{"path":"/life-rpg-play/assets/companion-watch-state-DfveqyE5.js","digest":"c7894c5ef281508364f126719db454da6cb858bdd3546703581015d19fde0aaf","bytes":5924},{"path":"/life-rpg-play/assets/CompanionPresence-C4S_hB-h.js","digest":"427f7ae916f4086a76153f43fe369779c99a024b88915683750da82977cf3e69","bytes":3349},{"path":"/life-rpg-play/assets/CompanionRememberedWords-Dre0J7hQ.js","digest":"f690ac65a61e7139dac43e37a645c8b2502173575fa638be722f9b5c5aa5f1e4","bytes":3039},{"path":"/life-rpg-play/assets/DailyPlanDialog-B7A22RZe.js","digest":"7a8b8f335d34353299d55db695c4cece7eafe50e82defeb9699803b6afbf7b37","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-D8nnYxRQ.js","digest":"925f2fdde3b483266c5f159d0657331210c3e705034173b35b8604a4c2155b2f","bytes":23240},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-DnKNEMXv.js","digest":"7bc7648f1302cc1c30492dd523797b45317d63bf09583487a4c7afdd250bdd28","bytes":8621},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/Growth-D9PNsl1n.js","digest":"427a82a932b4f568444dbd8184dd6517be31286974ca18fd38f0f412ae79e5f1","bytes":26033},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/GrowthOpportunity-Cr5qMNSF.js","digest":"7ed37a04247fa576f1b2e80eabc5a72ae192855c36e5b76d852c48426a522be8","bytes":42420},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-BHoypnTW.js","digest":"156b2dfd4fc4414f9c1e9296796d3c0d5e01a9ff78c83a076ff5831fb1d06949","bytes":106248},{"path":"/life-rpg-play/assets/GuidanceEditor-hEFB6-c3.css","digest":"506e0160bcbebde5d37ceeda1a92383ba9c426944765bc61aba4e50eaf27c776","bytes":7412},{"path":"/life-rpg-play/assets/HabiticaImport-BWLmr_xb.js","digest":"919cc553a5a5f63f2b7fc80a3487f9e92ded337f33afe23455c6596e62a096ea","bytes":12351},{"path":"/life-rpg-play/assets/HabiticaImport-CpZ6rig5.css","digest":"57ecd85f6e1216235c8a4e52c68eda4651a56339b4e94238400671e6cbde3ee5","bytes":832},{"path":"/life-rpg-play/assets/index-BrbK3JB0.js","digest":"882ba34379c96d14994318615cd160bd751cf74452c5b0846b90db844729c60a","bytes":560194},{"path":"/life-rpg-play/assets/index-DhKDPsvS.css","digest":"c5cb346fb4cc5d62247dd97eeaf9cee3e3960ecc105b7411a9c9aa7fa17cc9b4","bytes":59930},{"path":"/life-rpg-play/assets/LocalConditionClues-BtzbZLDr.js","digest":"a706745e53553ad2145e3758720a1f1b7b5a956faae49277481bdf740d60dfa1","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-asep3smN.js","digest":"6323a34dd34f1193d0a7e43f515ed3b23af603417da2cda5b6306fedcdda09d6","bytes":1555},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/model-TntchJ9f.js","digest":"53d9aae7f148b64623ba59f83c84f54d6cf3f0839ad71a7f36de391c93e7deb4","bytes":61172},{"path":"/life-rpg-play/assets/QuickCaptureEditor-D7N2QIOk.js","digest":"f6f2c75d2a338a0b73426fd93fb70f71810edb3c05c28160baad20fa2336cfde","bytes":16499},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/RecordRecovery-mG3aZJmU.js","digest":"eff486e5eb816c0f045d30146f87e29e4fe588331163491e6e5ae54b31edef76","bytes":4975},{"path":"/life-rpg-play/assets/save-BkXHxDWL.js","digest":"ee63a065c34c993861dbf9c13c5c9004613a2e03be777399946df6b7ae61e85e","bytes":317},{"path":"/life-rpg-play/assets/schemas-CApDvOU8.js","digest":"54e72bca304fc98df768c6e47d92473f8b7609f1bd5173d4215d5543bf901ab2","bytes":87492},{"path":"/life-rpg-play/assets/starter-method-state-DTzdQBMr.js","digest":"8786421726caff386cddeedf87556d0fe361bb6c0e054f66ebf8aa4a1d3d6788","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-BKj_Yzqa.js","digest":"3615c57fdb8f40cac4d96031fb75d38154b987922fb8b710648540eace8dc42c","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-CKo5VQSz.js","digest":"a77e3814fd050f126d517269dbf0550acf3f351efa316fea6b2629b201f01217","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-Cq4jBtur.js","digest":"7a47f3603e771ec4ff270ca55af792a534b06bed1c53b2c1dc368730e084cadb","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/StepCaptureEditor-D3q5C77q.js","digest":"b86c4194b82098cd09fc0d15ba585f2a6cf259e76222278d77b95d573e3ba3cf","bytes":15468},{"path":"/life-rpg-play/assets/ui-runtime-k-0UFiBe.js","digest":"2366f6b65a5e66e65fa2967704474030e85cb64dbee8ef6f726f25232512ee56","bytes":218824},{"path":"/life-rpg-play/assets/WatchPlan-BmTwMUsM.js","digest":"4156591992056415e3009f74367280ffaf5ecde8e5dd1dbc76680865d45440bc","bytes":5558},{"path":"/life-rpg-play/index.html","digest":"fbda6cbfd699727c4e6ceadcb6b2c6a72f098cd67ba1d2f645dad1e0897df8dd","bytes":1399}]});
