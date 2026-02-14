from django.http import JsonResponse
import pickle
import pandas as pd
import os
import shap  # New: SHAP for Explainable AI
from .utils import extract_url_heuristics

# Locate the model files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model = pickle.load(open(os.path.join(BASE_DIR, 'lighthub_model.pkl'), 'rb'))
feature_names = pickle.load(open(os.path.join(BASE_DIR, 'feature_list.pkl'), 'rb'))

# Initialize the SHAP Explainer (TreeExplainer is optimized for Random Forest)
explainer = shap.TreeExplainer(model)

def analyze_url(request):
    url = request.GET.get('url', '')
    if not url:
        return JsonResponse({'error': 'No URL provided'}, status=400)

    # 1. Feature Extraction
    data_dict = extract_url_heuristics(url)
    # Ensure features are in the exact order the model expects
    df = pd.DataFrame([data_dict])[feature_names] 

    # 2. Prediction (Fuzzy Logic thresholds)
    prob = float(model.predict_proba(df)[0][1]) 
    risk = "Low" if prob < 0.3 else "Medium" if prob < 0.7 else "High"

    # 3. XAI Logic: Calculate SHAP values
    # shap_values[1] refers to the "Phishing" class
    shap_values = explainer.shap_values(df)
    
    # Handle different SHAP output formats (binary vs multi-class)
    current_shap = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]

    # Map SHAP values to feature names for the extension UI
    # We convert to float to ensure JSON serializability
    shap_contribution = {feature_names[i]: float(current_shap[i]) for i in range(len(feature_names))}
        
    return JsonResponse({
        'url': url, 
        'probability': round(prob, 4), 
        'risk_level': risk,
        'shap_values': shap_contribution  # Feeds the bar charts in your extension
    })

