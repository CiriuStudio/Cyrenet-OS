// SPDX-FileCopyrightText: 2026 Cyrenet OS Contributors
// SPDX-License-Identifier: GPL-3.0-only
'use strict';
'require view';
'require rpc';

var callPocStatus = rpc.declare({
	object: 'luci.cyrenet.poc',
	method: 'status',
	expect: {}
});

function ensureStylesheet(cssPath) {
	var selector = 'link[data-cyrenet-css="' + cssPath + '"]';
	if (document.querySelector(selector)) {
		return;
	}
	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = L.resource('cyrenet/' + cssPath);
	link.setAttribute('data-cyrenet-css', cssPath);
	document.head.appendChild(link);
}

function renderFallback(rootEl, errorMessage) {
	rootEl.textContent = '';
	rootEl.appendChild(E('div', { 'class': 'alert-message warning' }, [
		E('h4', {}, _('Cyrenet UI Feature Island unavailable')),
		E('p', {}, errorMessage),
		E('p', {}, [
			E('a', {
				'class': 'btn cbi-button',
				'href': L.url('admin/status/overview')
			}, _('Open Native LuCI Overview'))
		])
	]));
}

return view.extend({
	load: function () {
		return fetch(L.resource('cyrenet/manifest.json'), {
			credentials: 'same-origin',
			cache: 'no-cache'
		}).then(function (res) {
			if (!res.ok) {
				throw new Error('HTTP ' + res.status + ' loading Cyrenet asset manifest');
			}
			return res.json();
		});
	},

	render: function (manifest) {
		var rootEl = E('div', {
			'id': 'cyrenet-app-root',
			'class': 'cyrenet-ui-root',
			'data-island': 'poc'
		}, [
			E('div', { 'class': 'spinning' }, _('Loading Cyrenet UI POC...'))
		]);

		var entry = manifest && manifest['src/entries/poc.tsx'];
		if (!entry || !entry.file) {
			renderFallback(rootEl, _('Missing entry src/entries/poc.tsx in Cyrenet UI manifest.'));
			return rootEl;
		}

		if (Array.isArray(entry.css)) {
			entry.css.forEach(ensureStylesheet);
		}

		var mounted = null;
		var cleanupObserver = null;

		var unmountIsland = function () {
			if (cleanupObserver) {
				cleanupObserver.disconnect();
				cleanupObserver = null;
			}
			if (mounted && typeof mounted.unmount === 'function') {
				mounted.unmount();
				mounted = null;
			}
			window.removeEventListener('pagehide', unmountIsland);
		};

		import(L.resource('cyrenet/' + entry.file)).then(function (mod) {
			if (!mod || typeof mod.mountCyrenetIsland !== 'function') {
				throw new Error('Missing mountCyrenetIsland export in ' + entry.file);
			}
			mounted = mod.mountCyrenetIsland(rootEl, {
				lang: document.documentElement.lang || 'zh-cn',
				resourceBase: L.resource('cyrenet'),
				callRpc: function (objectName, methodName) {
					if (objectName === 'luci.cyrenet.poc' && methodName === 'status') {
						return callPocStatus();
					}
					return Promise.reject({
						code: 'UNSUPPORTED',
						message: 'Unsupported RPC method: ' + objectName + '.' + methodName
					});
				}
			});

			window.addEventListener('pagehide', unmountIsland, { once: true });
			if (typeof MutationObserver !== 'undefined') {
				cleanupObserver = new MutationObserver(function () {
					if (!document.body.contains(rootEl)) {
						unmountIsland();
					}
				});
				cleanupObserver.observe(document.body, { childList: true, subtree: true });
			}
		}).catch(function (err) {
			renderFallback(rootEl, err && err.message ? err.message : String(err));
		});

		return rootEl;
	},

	addFooter: function () {
		return E([]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
