if (typeof lighthubInitialized === 'undefined') {
    var lighthubInitialized = true;

    const panel = document.createElement('div');
    panel.id = 'lighthub-panel';
    panel.style.cssText = `
        position: fixed; top: 0; right: -450px; width: 400px; height: 100vh;
        z-index: 2147483647; box-shadow: -20px 0 50px rgba(0,0,0,0.5);
        transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        display: flex; flex-direction: column; color: #ffffff;
        background: linear-gradient(135deg, rgba(15, 15, 20, 0.98), rgba(30, 30, 40, 0.98));
        backdrop-filter: blur(20px); border-left: 1px solid rgba(255, 255, 255, 0.1);
    `;

    panel.innerHTML = `
        <div style="padding: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-size: 0.7rem; color: #d48045; font-weight: 800; letter-spacing: 2px; margin-bottom: 4px;">LIGHTHUB</div>
                <div style="font-size: 1.1rem; font-weight: 300; letter-spacing: 1px;">XAI <span style="font-weight: 700;">ENGINE</span></div>
            </div>
            <button id="lh-close" style="background: rgba(255,255,255,0.05); border: none; border-radius: 50%; width: 32px; height: 32px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>

        <div style="padding: 30px 25px; flex-grow: 1; overflow-y: auto;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div id="lh-icon-container" style="font-size: 50px; margin-bottom: 10px;">🛰️</div>
                <div id="lh-risk" style="font-size: 2.2rem; font-weight: 900; letter-spacing: -1px; margin-bottom: 5px;">ANALYZING...</div>
                
                <div style="position: relative; height: 10px; background: linear-gradient(to right, #2ed573, #ffa502, #ff4757); border-radius: 5px; margin: 25px 0;">
                    <div id="lh-gauge-marker" style="position: absolute; top: -5px; left: 0%; width: 20px; height: 20px; background: #fff; border: 4px solid #1e1e28; border-radius: 50%; transition: left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>
                </div>
                
                <div id="lh-prob" style="font-size: 0.9rem; opacity: 0.7; font-weight: 500;">Calculating score...</div>
            </div>

            <div id="lh-safe-badge" style="display: none; margin-bottom: 25px; text-align: center; padding: 12px; border-radius: 10px; background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.3); animation: pulse 2s infinite;">
                <span style="color: #2ed573; font-weight: 700; font-size: 0.8rem; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span style="font-size: 1.1rem;">🛰️</span> VERIFIED LEGITIMATE
                </span>
            </div>

            <div id="lh-why-container" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; display: none;">
                <h3 style="font-size: 0.8rem; text-transform: uppercase; color: #d48045; margin-bottom: 15px; letter-spacing: 1px;">🔍 Security Insights</h3>
                <ul id="lh-why-list" style="font-size: 0.85rem; padding-left: 5px; color: rgba(255,255,255,0.8); line-height: 1.6; list-style-type: none;"></ul>
            </div>

            <div style="background: rgba(0, 0, 0, 0.2); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 0.65rem; color: rgba(255,255,255,0.4); text-transform: uppercase; margin: 0; letter-spacing: 1px;">Feature Impact Analysis</h3>
                    <div id="lh-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #d48045;"></div>
                </div>
                <div id="lh-shap-container" style="display: flex; flex-direction: column; gap: 16px;"></div>
            </div>
        </div>

        <div style="padding: 20px; font-size: 0.65rem; color: rgba(255,255,255,0.3); text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
            Protection v1.9.0 | Active XAI Monitoring
        </div>

        <style>
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0px rgba(46, 213, 115, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(46, 213, 115, 0); }
                100% { box-shadow: 0 0 0 0px rgba(46, 213, 115, 0); }
            }
        </style>
    `;

    function injectIfNotExists() {
        if (!document.getElementById('lighthub-panel')) {
            document.body.appendChild(panel);
            document.getElementById('lh-close').onclick = () => { panel.style.right = '-450px'; };
        }
    }

    function fetchPrediction(autoSlide = false) {
        const apiUrl = `http://127.0.0.1:8000/api/analyze/?url=${encodeURIComponent(window.location.href)}`;
        
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                const riskLabel = document.getElementById('lh-risk');
                const probLabel = document.getElementById('lh-prob');
                const gaugeMarker = document.getElementById('lh-gauge-marker');
                const safeBadge = document.getElementById('lh-safe-badge');
                const shapContainer = document.getElementById('lh-shap-container');
                const whyContainer = document.getElementById('lh-why-container');
                const statusDot = document.getElementById('lh-status-dot');

                if (riskLabel && data.shap_values) {
                    const riskPercent = (data.probability * 100).toFixed(2);
                    const isHigh = data.risk_level === 'High';
                    const themeColor = isHigh ? '#ff4757' : (riskPercent < 10 ? '#2ed573' : '#ffa502');
                    
                    riskLabel.innerText = data.risk_level + " RISK";
                    riskLabel.style.color = themeColor;
                    probLabel.innerText = `Phishing Risk Score: ${riskPercent}%`;
                    gaugeMarker.style.left = `calc(${riskPercent}% - 10px)`;
                    statusDot.style.background = themeColor;

                    // Badge Logic - Scanner🛰️ appears if very safe
                    safeBadge.style.display = (parseFloat(riskPercent) < 5.0) ? 'block' : 'none';

                    if (isHigh || !autoSlide) panel.style.right = '0';

                    const sortedEntries = Object.entries(data.shap_values).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
                    whyContainer.style.display = 'block';
                    document.getElementById('lh-why-list').innerHTML = sortedEntries.slice(0, 3).map(([feature, val]) => {
                        const cleanName = feature.replace(/([A-Z])/g, ' $1').trim();
                        const impact = val > 0 ? `<span style="color: #ff4757;">increases risk</span>` : `<span style="color: #2ed573;">improves safety</span>`;
                        return `<li style="margin-bottom: 10px;"><b>${cleanName}</b> ${impact}.</li>`;
                    }).join('');

                    const totalImpact = Object.values(data.shap_values).reduce((acc, val) => acc + Math.abs(val), 0);
                    shapContainer.innerHTML = sortedEntries.map(([feature, val]) => {
                        const percentage = ((Math.abs(val) / totalImpact) * 100).toFixed(1);
                        const color = val > 0 ? '#ff4757' : '#3498db';
                        return `<div><div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px"><span>${feature.replace(/([A-Z])/g, ' $1').trim()}</span><span style="color:${color}">${percentage}%</span></div>
                                <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:10px"><div style="width:${percentage}%;height:100%;background:${color};border-radius:10px;transition:width 1s"></div></div></div>`;
                    }).join('');
                }
            })
            .catch(() => { if(document.getElementById('lh-risk')) document.getElementById('lh-risk').innerText = "OFFLINE"; });
    }

    chrome.runtime.onMessage.addListener((msg, s, sendResponse) => {
        if (msg.action === "toggle_lighthub_panel") { injectIfNotExists(); panel.style.right = '0'; fetchPrediction(false); }
        if (msg.action === "ping") sendResponse({status: "alive"});
    });

    if (document.readyState === 'complete') { injectIfNotExists(); fetchPrediction(true); }
    else { window.addEventListener('load', () => { injectIfNotExists(); fetchPrediction(true); }); }
}