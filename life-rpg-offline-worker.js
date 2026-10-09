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
})({"base":"/life-rpg-play/","version":"ad981dda8cdbeb1b80f2931d","assets":[{"path":"/life-rpg-play/assets/AbilitySources-C0U0yAmM.js","digest":"98811c6bbd9c0cc9c860cf9e4a4a18850c71e1fbc0769e4419626a2794f85c41","bytes":23482},{"path":"/life-rpg-play/assets/AbilitySources-D9xehR6C.css","digest":"cfce1ebe68f841d9fe800d4c44b420deecf9eaa754b92da6626957de0975b25c","bytes":4552},{"path":"/life-rpg-play/assets/Adventure-BBHnR8xk.css","digest":"fffda1044f80173ecbf92dbcb6cecf30f7b47ff16e15dec85bfa88b25b18511e","bytes":43375},{"path":"/life-rpg-play/assets/Adventure-CKvb4E4-.js","digest":"6a652c08dc6f6e8ebfae3bd8978faf2d61d3754c068c5e25ff3b7fa40fdecdd8","bytes":247211},{"path":"/life-rpg-play/assets/companion-dawn-state-Dxxs1uow.js","digest":"acadaa8d3970cb288f41d3c417b445c7732d9f321ba87480ed9a648eab0a1b16","bytes":8107},{"path":"/life-rpg-play/assets/companion-ferry-meta-Czv_ZwZE.js","digest":"0f27966830076359e465b4133657604847e1bd28f83cc9aae0a87937f7a3a042","bytes":8510},{"path":"/life-rpg-play/assets/companion-ferry-state-B2rEZstO.js","digest":"44c57d4060460abdc978370c6d1ca7dd5595a5f9331ebfb205a128a5b11d953c","bytes":4887},{"path":"/life-rpg-play/assets/companion-watch-journal-FswGPhl7.js","digest":"8aa2334f9dfdc309d7bec40a02ca2de5d3ea169922d625ebb711d6fa6074652e","bytes":66956},{"path":"/life-rpg-play/assets/companion-watch-meta-DtNdws0A.js","digest":"880229e778b3c6d9f3ebfdee1e935c8dcd802645eb1eca4690e527a9fc0cd30c","bytes":2813},{"path":"/life-rpg-play/assets/companion-watch-state-DfveqyE5.js","digest":"c7894c5ef281508364f126719db454da6cb858bdd3546703581015d19fde0aaf","bytes":5924},{"path":"/life-rpg-play/assets/CompanionPresence-DJSmq3WF.js","digest":"dbeeca696411407c3f2551c6adcd31a52ef7139b81cdd76e8b44fe2f18edf3e0","bytes":3349},{"path":"/life-rpg-play/assets/CompanionRememberedWords-BfMZ-j8Y.js","digest":"54a066dd92af761f1d39dbfb6a304256cd8a25c495411513f72d5fc7ca0d9c50","bytes":3039},{"path":"/life-rpg-play/assets/DailyPlanDialog-DFCTwcsN.js","digest":"88a8b91cad64c0b38ee6f37b10dcc634dc25d87deb1d65296f6da14dc375702c","bytes":17208},{"path":"/life-rpg-play/assets/DraftManager-qpdPu_2A.js","digest":"69eb440af19667339c3cfc316e83fff0862c327a769f042891651cb3498385d1","bytes":23240},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-C58pPd_-.js","digest":"742156a8544a372f5ec2fea61c28e3a0012ea38a133ce2d3bc59a22ea633fec3","bytes":8621},{"path":"/life-rpg-play/assets/GoalStarterMethodEditor-D5xklhBR.css","digest":"6a07a57b86a4d3119e11cfeed978e1d7808e829540812140051eae3ae3d4f3f1","bytes":482},{"path":"/life-rpg-play/assets/Growth-4ZAlsy6s.js","digest":"0e0425e8bc81f03b2e626cb1e857a6e34e6415355d63c3f899bd434227406694","bytes":26033},{"path":"/life-rpg-play/assets/Growth-BUXozbJh.css","digest":"f00ca1da3f28daf9e715925913fc14181433dc071026cd910d633c0a8a1272b2","bytes":4777},{"path":"/life-rpg-play/assets/GrowthOpportunity-CaLzY-BN.css","digest":"37fe811df18c83df2a22f192fd5ff3657cd4e52dfe1677ca052f93fdcd7c6acf","bytes":596},{"path":"/life-rpg-play/assets/GrowthOpportunity-cm_t5e_v.js","digest":"9379dd20ea59dfe4e6ad7367e348d06ecf338bc69d981366c5cf313ee7174c4d","bytes":42420},{"path":"/life-rpg-play/assets/guidance-drafts-B2KnLCgI.css","digest":"fa689e9322e81b9463da94a2df0d39d79865176f0de71dd17b64bb4c80480ff7","bytes":5169},{"path":"/life-rpg-play/assets/GuidanceEditor-5-oge2Ow.js","digest":"93af52ea52c64aef124d60277b45ecf084a273b06c81cfe3d9236ba72b07d11b","bytes":106248},{"path":"/life-rpg-play/assets/GuidanceEditor-hEFB6-c3.css","digest":"506e0160bcbebde5d37ceeda1a92383ba9c426944765bc61aba4e50eaf27c776","bytes":7412},{"path":"/life-rpg-play/assets/HabiticaImport-CpZ6rig5.css","digest":"57ecd85f6e1216235c8a4e52c68eda4651a56339b4e94238400671e6cbde3ee5","bytes":832},{"path":"/life-rpg-play/assets/HabiticaImport-D0jjjlRf.js","digest":"227a7837f84feabe236986bd64e03df01a557930ea484d2e17efeea6fdbb55cf","bytes":12351},{"path":"/life-rpg-play/assets/index-BZSA8A12.css","digest":"0f6801098ce5f914bd12beae178a019222a7a061fb1bd2504a96a37b1a3ce546","bytes":60277},{"path":"/life-rpg-play/assets/index-D5Vtp4Vt.js","digest":"e57e68ba253bbcaafe0f5939efdf7e9ee27bab754a965367fa1e6b40ae6c14cd","bytes":562415},{"path":"/life-rpg-play/assets/LocalConditionClues-lU9Y-_ax.js","digest":"20abae401ab210b5499d563ca6ab8326b8438465915c02d76e0d011c6185dc75","bytes":48432},{"path":"/life-rpg-play/assets/MilestoneFeedback-DT8T2Rk6.js","digest":"3ba1ab7ea7027e01f41d0df1ee2166678b983cb8ec4c3267e01577a547613545","bytes":1555},{"path":"/life-rpg-play/assets/MilestoneFeedback-m_Kg2Zb3.css","digest":"4a7c8acb5d31866a743efd4c3eef486dd414f6add778bb5160604169e7fdb441","bytes":778},{"path":"/life-rpg-play/assets/model-TntchJ9f.js","digest":"53d9aae7f148b64623ba59f83c84f54d6cf3f0839ad71a7f36de391c93e7deb4","bytes":61172},{"path":"/life-rpg-play/assets/QuickCaptureEditor-fOGJyLlU.css","digest":"c71f12feba8205836ab820ae5bfc66e0d93a0de89f29cb4b554c35bc80ea69af","bytes":380},{"path":"/life-rpg-play/assets/QuickCaptureEditor-Ye7U6xB9.js","digest":"0b5174e8a1917a30e2028997245bc526da17c646a6018ed8c9852b4e1d3d06c9","bytes":16499},{"path":"/life-rpg-play/assets/RecordRecovery--UyjP2AJ.js","digest":"207f9bd72b2dcd08a2726b39a7b76bc7e66d9032438f5f2a64b4eb317c0466e7","bytes":4975},{"path":"/life-rpg-play/assets/save-BW7curHA.js","digest":"9dc63ac467bbc7aaeabda010c7c268220a4de62b591000d37f84ed0adb034065","bytes":317},{"path":"/life-rpg-play/assets/schemas-CApDvOU8.js","digest":"54e72bca304fc98df768c6e47d92473f8b7609f1bd5173d4215d5543bf901ab2","bytes":87492},{"path":"/life-rpg-play/assets/starter-method-state-DTzdQBMr.js","digest":"8786421726caff386cddeedf87556d0fe361bb6c0e054f66ebf8aa4a1d3d6788","bytes":1886},{"path":"/life-rpg-play/assets/starter-methods-BKj_Yzqa.js","digest":"3615c57fdb8f40cac4d96031fb75d38154b987922fb8b710648540eace8dc42c","bytes":1489},{"path":"/life-rpg-play/assets/StarterMethodEditor-gZq3VT4j.js","digest":"14b4dbba807b326b048f3ed24801052fff6de7737226b88b93c18a9dbdbd1216","bytes":3600},{"path":"/life-rpg-play/assets/StarterScopeMarker-CCg1w5UD.js","digest":"bedb82dc7882918999bec8c604ca431ea013120974848d92469e90ade6fd7722","bytes":2837},{"path":"/life-rpg-play/assets/StepCaptureEditor-8idLgiYI.css","digest":"46fb859515144f2b712297a5ab0d372c24bec3a1cfd388a47cee55f9e26a0dd5","bytes":804},{"path":"/life-rpg-play/assets/StepCaptureEditor-CjM41SPg.js","digest":"12bbc3394357ec66084a806a7de03a252dcd359441bce2470009ffc255fd6d54","bytes":15468},{"path":"/life-rpg-play/assets/ui-runtime-k-0UFiBe.js","digest":"2366f6b65a5e66e65fa2967704474030e85cb64dbee8ef6f726f25232512ee56","bytes":218824},{"path":"/life-rpg-play/assets/WatchPlan-SA0RT7Y3.js","digest":"459f8b4b9d3bd5fc8589243c976beb7b9beea986def748339648452031baf792","bytes":5558},{"path":"/life-rpg-play/index.html","digest":"9fc807376d811788c8ee4413b56aeb1cab6eeab0120ebe19f38ecee0cbcba320","bytes":1399}]});
