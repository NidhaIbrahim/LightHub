import urllib.parse
import re

def extract_url_heuristics(url):
    # This logic matches your verified Colab diagnostics
    parsed = urllib.parse.urlparse(url)
    url_len = len(url)
    
    # We define exactly what the Random Forest expects
    features = {
        'URLLength': url_len,
        'NoOfLettersInURL': sum(c.isalpha() for c in url),
        'NoOfDegitsInURL': sum(c.isdigit() for c in url),
        'NoOfEqualsInURL': url.count('='),
        'NoOfQMarkInURL': url.count('?'),
        'NoOfAmpersandInURL': url.count('&'),
        'NoOfOtherSpecialCharsInURL': len(re.sub(r'[a-zA-Z0-9]', '', url)),
        'SpacialCharRatioInURL': len(re.sub(r'[a-zA-Z0-9]', '', url)) / url_len if url_len > 0 else 0,
        'LetterRatioInURL': sum(c.isalpha() for c in url) / url_len if url_len > 0 else 0,
        'DegitRatioInURL': sum(c.isdigit() for c in url) / url_len if url_len > 0 else 0
    }
    return features