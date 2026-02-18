from django.http import JsonResponse
import pickle
import pandas as pd
import os
import numpy as np
import shap
from .utils import extract_url_heuristics

# Locate the model files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model = pickle.load(open(os.path.join(BASE_DIR, 'lighthub_model.pkl'), 'rb'))
feature_names = pickle.load(open(os.path.join(BASE_DIR, 'feature_list.pkl'), 'rb'))

# Initialize the SHAP Explainer
explainer = shap.TreeExplainer(model)

def analyze_url(request):
    url = request.GET.get('url', '')
    if not url:
        return JsonResponse({'error': 'No URL provided'}, status=400)

    try:
        data_dict = extract_url_heuristics(url)
        df = pd.DataFrame([data_dict])[feature_names] 
        prob = float(model.predict_proba(df)[0][1]) 
        risk = "Low" if prob < 0.3 else "Medium" if prob < 0.7 else "High"

        # Calculate SHAP values
        shap_values = explainer.shap_values(df)
        
        # --- ROBUST SHAP INDEXING FIX ---
        # This handles the "only length-1 arrays" error by correctly 
        # flattening the SHAP output regardless of library version.
        if isinstance(shap_values, list):
            current_shap = shap_values[1][0]
        elif len(shap_values.shape) == 3:
            current_shap = shap_values[0, :, 1]
        else:
            current_shap = shap_values[0]

        # Map to features and ensure they are standard Python floats
        shap_contribution = {
            feature_names[i]: float(current_shap[i]) 
            for i in range(len(feature_names))
        }
            
        return JsonResponse({
            'url': url, 
            'probability': round(prob, 4), 
            'risk_level': risk,
            'shap_values': shap_contribution 
        })

    except Exception as e:
        # This will print the exact error in your terminal if it fails again
        print(f"XAI ERROR: {e}") 
        return JsonResponse({'error': str(e)}, status=500)