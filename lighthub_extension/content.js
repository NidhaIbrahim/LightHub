// 1. DEFINE VARIABLES FIRST to prevent ReferenceErrors
const bgImageUrl = chrome.runtime.getURL("background.jpg"); 

// 2. CREATE THE UI PANEL
const panel = document.createElement('div');
panel.id = 'lighthub-panel';
panel.style.cssText = `
    position: fixed; top: 0; right: -450px; width: 420px; height: 100vh;
    z-index: 2147483647; box-shadow: -15px 0 50px rgba(0,0,0,0.8);
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    font-family: 'Segoe UI', 'Consolas', monospace; display: flex; flex-direction: column;
    color: #ffffff; overflow-y: auto;
    background: linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('${bgImageUrl}');
    background-size: cover; background-position: center; backdrop-filter: blur(10px);
    border-left: 1px solid rgba(212, 128, 69, 0.3);
`;

panel.innerHTML = `
    <div style="padding: 20px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(212, 128, 69, 0.2); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; color: #fff; font-size: 1rem; letter-spacing: 1px;">LIGHTHUB <span style="color:#d48045">XAI ENGINE</span></span>
        <button id="lh-close" style="background:none; border:none; color:#d48045; cursor:pointer; font-size: 24px;">&times;</button>
    </div>

    <div style="padding: 30px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div id="lh-icon" style="font-size: 50px; margin-bottom: 10px;">🛡️</div>
            <div id="lh-risk" style="font-size: 2rem; font-weight: 900; color: #fff;">ANALYZING...</div>
            <div id="lh-prob" style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">Awaiting inference results...</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(212, 128, 69, 0.3); border-radius: 12px; padding: 20px;">
            <h3 style="font-size: 0.75rem; color: #d48045; text-transform: uppercase; margin-top: 0; letter-spacing: 1.5px;">Feature Impact (SHAP)</h3>
            <p style="font-size: 0.7rem; color: #888; margin-bottom: 15px;">Contribution of URL features to the risk score:</p>
            <div id="lh-shap-container" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="font-size: 0.7rem; color: rgba(255,255,255,0.4); text-align: center;">Calculating SHAP vectors...</div>
            </div>
        </div>
    </div>
`;

document.body.appendChild(panel);

// Close button logic
document.getElementById('lh-close').onclick = () => { panel.style.right = '-450px'; };

// 3. LOGIC (Includes XAI visualization)
function fetchPrediction(autoSlide = false) {
    const apiUrl = `http://127.0.0.1:8000/api/analyze/?url=${encodeURIComponent(window.location.href)}`;
    
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            const riskLabel = document.getElementById('lh-risk');
            const icon = document.getElementById('lh-icon');
            const shapContainer = document.getElementById('lh-shap-container');

            if (riskLabel && icon && shapContainer) {
                riskLabel.innerText = data.risk_level + " RISK";
                document.getElementById('lh-prob').innerText = `Model Certainty: ${(data.probability * 100).toFixed(2)}%`;

                // Color coding based on risk
                riskLabel.style.color = data.risk_level === 'High' ? '#e74c3c' : '#27ae60';
                icon.innerText = data.risk_level === 'High' ? '🚨' : '✅';

                // AUTO-SLIDE if High Risk
                if (data.risk_level === 'High' || !autoSlide) panel.style.right = '0';

                // RENDER SHAP BARS
                if (data.shap_values) {
                    shapContainer.innerHTML = ''; 
                    Object.entries(data.shap_values).forEach(([feature, val]) => {
                        const width = Math.min(Math.abs(val) * 100, 100);
                        const color = val > 0 ? '#e74c3c' : '#3498db'; // Red for threat, Blue for safety
                        
                        shapContainer.innerHTML += `
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.65rem; margin-bottom: 4px;">
                                    <span>${feature.replace(/_/g, ' ')}</span>
                                    <span style="color: ${color}">${val > 0 ? '+' : ''}${val.toFixed(3)}</span>
                                </div>
                                <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px;">
                                    <div style="height: 100%; width: ${width}%; background: ${color}; border-radius: 3px; transition: width 0.8s ease;"></div>
                                </div>
                            </div>`;
                    });
                }
            }
        })
        .catch(err => {
            console.error("Connection failed:", err); // Supports
            const riskLabel = document.getElementById('lh-risk');
            if (riskLabel) riskLabel.innerText = "OFFLINE";
        });
}

// 4. LISTEN FOR THE MESSAGE FROM BACKGROUND.JS
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggle_lighthub_panel") {
        panel.style.right = '0';
        fetchPrediction(false);
    }
});

// Run once automatically on load
fetchPrediction(true);