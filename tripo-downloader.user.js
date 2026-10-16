// ==UserScript==
// @name         Tripo3D Free Model Downloader
// @namespace    https://github.com/
// @version      1.0.0
// @description  Intercepts 3D mesh network traffic on Tripo Studio to download textured models.
// @author       YourName
// @match        https://studio.tripo3d.ai/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let capturedUrl = null;
    let capturedExt = 'fbx';

    function injectUI() {
        if (document.getElementById('tripo-dl-container')) return;

        const container = document.createElement('div');
        container.id = 'tripo-dl-container';
        container.style.cssText = `
            position: fixed; top: 80px; right: 20px; z-index: 999999;
            display: flex; gap: 8px; font-family: system-ui, -apple-system, sans-serif;
        `;

        const reloadBtn = document.createElement('button');
        reloadBtn.innerHTML = '↻ Reload';
        reloadBtn.style.cssText = `
            padding: 10px 14px; background: #0f172a; color: #e2e8f0;
            border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px;
            font-weight: 600; font-size: 13px; cursor: pointer;
        `;
        reloadBtn.onclick = () => {
            const url = new URL(window.location.href);
            url.searchParams.set('refresh', Date.now());
            window.location.href = url.toString();
        };

        const dlBtn = document.createElement('button');
        dlBtn.id = 'tripo-dl-btn';
        dlBtn.innerText = 'Scanning Traffic...';
        dlBtn.disabled = true;
        dlBtn.style.cssText = `
            padding: 10px 18px; background: #1e293b; color: #64748b;
            border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px;
            font-weight: 600; font-size: 13px; cursor: not-allowed;
            transition: all 0.3s ease;
        `;

        dlBtn.onclick = () => {
            if (capturedUrl) {
                const a = document.createElement('a');
                a.href = capturedUrl;
                a.download = `tripo_model.${capturedExt}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        };

        container.appendChild(reloadBtn);
        container.appendChild(dlBtn);
        document.body.appendChild(container);

        if (capturedUrl) updateUI();
    }

    function updateUI() {
        const btn = document.getElementById('tripo-dl-btn');
        if (btn && capturedUrl) {
            btn.innerText = `Download .${capturedExt.toUpperCase()} Model`;
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btn.style.color = '#ffffff';
            btn.style.cursor = 'pointer';
            btn.disabled = false;
        }
    }

    // Intercept Fetch API
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const cleanUrl = url.split('?')[0].toLowerCase();

        if (cleanUrl.endsWith('.fbx')) { capturedUrl = url; capturedExt = 'fbx'; updateUI(); }
        else if (cleanUrl.endsWith('.glb')) { capturedUrl = url; capturedExt = 'glb'; updateUI(); }
        else if (cleanUrl.endsWith('.gltf')) { capturedUrl = url; capturedExt = 'gltf'; updateUI(); }
        else if (cleanUrl.endsWith('.obj')) { capturedUrl = url; capturedExt = 'obj'; updateUI(); }

        return originalFetch.apply(this, args);
    };

    // Intercept XHR
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('load', function() {
            if (typeof url === 'string') {
                const cleanUrl = url.split('?')[0].toLowerCase();
                if (cleanUrl.endsWith('.fbx')) { capturedUrl = url; capturedExt = 'fbx'; updateUI(); }
                else if (cleanUrl.endsWith('.glb')) { capturedUrl = url; capturedExt = 'glb'; updateUI(); }
            }
        });
        originalOpen.apply(this, arguments);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectUI);
    } else {
        injectUI();
    }

    setInterval(injectUI, 2000);
})();
