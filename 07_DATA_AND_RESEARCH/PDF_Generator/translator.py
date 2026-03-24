from deep_translator import GoogleTranslator

KANNADA_FONT = '/Users/fortunemarq/Desktop/FortuneMarq_Build/Brand_Assets/NotoSansKannada-Regular.ttf'

# Cache to avoid repeated API calls
_cache = {}

# Pre-translated common phrases — checked first to reduce API calls
STATIC_TRANSLATIONS = {
    'GMB Profiles': 'ಜಿಎಂಬಿ ಪ್ರೊಫೈಲ್‌ಗಳು',
    'Directories': 'ಡೈರೆಕ್ಟರಿಗಳು',
    'Social Media': 'ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ',
    'Local Websites': 'ಸ್ಥಳೀಯ ವೆಬ್‌ಸೈಟ್‌ಗಳು',
    'monthly searches': 'ಮಾಸಿಕ ಹುಡುಕಾಟಗಳು',
    'Book Your Free Consultation': 'ನಿಮ್ಮ ಉಚಿತ ಸಮಾಲೋಚನೆ ಬುಕ್ ಮಾಡಿ',
    'Marketing That Pays You Back': 'ನಿಮಗೆ ಹಿಂದಿರುಗಿಸುವ ಮಾರ್ಕೆಟಿಂಗ್',
    'DATA SOURCE: Google Keyword Planner + Google Search Results': 'ಮಾಹಿತಿ ಮೂಲ: ಗೂಗಲ್ ಕೀವರ್ಡ್ ಪ್ಲಾನರ್ + ಗೂಗಲ್ ಸರ್ಚ್ ರಿಸಲ್ಟ್ಸ್',
    'Google Business Profile': 'ಗೂಗಲ್ ಬಿಸಿನೆಸ್ ಪ್ರೊಫೈಲ್',
    'Business Website': 'ಬಿಸಿನೆಸ್ ವೆಬ್‌ಸೈಟ್',
    'Local SEO': 'ಲೋಕಲ್ ಎಸ್‌ಇಒ',
    'Google Ads': 'ಗೂಗಲ್ ಜಾಹೀರಾತು',
    'Meta Ads': 'ಮೆಟಾ ಜಾಹೀರಾತು',
    'Monthly Reports': 'ಮಾಸಿಕ ವರದಿಗಳು',
    'MARKET OPPORTUNITY REPORT': 'ಮಾರ್ಕೆಟ್ ಅವಕಾಶ ವರದಿ',
    'VISIBILITY REPORT': 'ದೃಶ್ಯಮಾನ ವರದಿ',
    'WEBSITE PERFORMANCE REPORT': 'ವೆಬ್‌ಸೈಟ್ ಕಾರ್ಯಕ್ಷಮತೆ ವರದಿ',
    'NICHE MARKET REPORT': 'ನಿಶ್ ಮಾರ್ಕೆಟ್ ವರದಿ',
    'Hubli': 'ಹುಬ್ಬಳ್ಳಿ',
    'Gyms': 'ಜಿಮ್‌ಗಳು',
    'Skin Clinics': 'ಚರ್ಮ ಚಿಕಿತ್ಸಾಲಯಗಳು',
    'Dental Clinics': 'ದಂತ ಚಿಕಿತ್ಸಾಲಯಗಳು',
    'Computer Training': 'ಕಂಪ್ಯೂಟರ್ ತರಬೇತಿ',
    'Car Rentals': 'ಕಾರ್ ಬಾಡಿಗೆ',
    'JEE NEET Coaching': 'ಜೆಇಇ ನೀಟ್ ಕೋಚಿಂಗ್',
    'Physiotherapy': 'ಫಿಸಿಯೋಥೆರಪಿ',
    'IVF Clinics': 'ಐವಿಎಫ್ ಚಿಕಿತ್ಸಾಲಯಗಳು',
    'IELTS Coaching': 'ಐಇಎಲ್‌ಟಿಎಸ್ ಕೋಚಿಂಗ್',
    'Interior Designers': 'ಇಂಟೀರಿಯರ್ ಡಿಸೈನರ್‌ಗಳು',
    'Modular Kitchens': 'ಮಾಡ್ಯುಲರ್ ಕಿಚನ್',
    'Real Estate': 'ರಿಯಲ್ ಎಸ್ಟೇಟ್',
    'Tuition Centres': 'ಟ್ಯೂಷನ್ ಸೆಂಟರ್‌ಗಳು',
    'Hotels': 'ಹೋಟೆಲ್‌ಗಳು',
    'reviews': 'ವಿಮರ್ಶೆಗಳು',
    'searches/month': 'ಹುಡುಕಾಟಗಳು/ತಿಂಗಳು',
    'Page': 'ಪುಟ',
    'of': 'ರಲ್ಲಿ',
    'March 2026': 'ಮಾರ್ಚ್ 2026',
    'YOUR GROWTH PARTNER — NOT JUST AN AGENCY': 'ನಿಮ್ಮ ಬೆಳವಣಿಗೆ ಪಾಲುದಾರ — ಕೇವಲ ಏಜೆನ್ಸಿ ಅಲ್ಲ',
    "Let's Talk About": 'ಮಾತನಾಡೋಣ',
    'Your Growth': 'ನಿಮ್ಮ ಬೆಳವಣಿಗೆ ಬಗ್ಗೆ',
}


def translate(text, target='kn'):
    """Translate text to Kannada. Returns original text on any failure."""
    if not text or not isinstance(text, str):
        return text

    # Check static translations first
    if text in STATIC_TRANSLATIONS:
        return STATIC_TRANSLATIONS[text]

    # Check runtime cache
    cache_key = (text, target)
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        result = GoogleTranslator(source='en', target=target).translate(text)
        _cache[cache_key] = result
        return result
    except Exception:
        # Never crash — return original English
        _cache[cache_key] = text
        return text


def translate_niche_data(niche_data):
    """
    Translate niche_data fields to Kannada.
    Returns original dict with added _kn suffix fields.
    """
    d = dict(niche_data)

    d['niche_kn'] = translate(niche_data['niche'])
    d['city_kn'] = translate(niche_data['city'])

    # Traffic category labels
    d['traffic_labels_kn'] = {
        'GMB Profiles': translate('GMB Profiles'),
        'Directories': translate('Directories'),
        'Social Media': translate('Social Media'),
        'Local Websites': translate('Local Websites'),
    }

    # Common page text
    d['monthly_searches_kn'] = translate('monthly searches')
    d['source_kn'] = translate('SOURCE: Google Keyword Planner')
    d['data_source_footer_kn'] = translate(
        'DATA SOURCE: Google Keyword Planner + Google Search Results'
    )

    return d


def get_translation_stats():
    """Return stats for reporting."""
    return {
        'api_calls': sum(1 for v in _cache.values()),
        'cache_size': len(_cache),
    }


if __name__ == '__main__':
    print("Testing translator.py...")
    print()

    # Test static translations
    tests = [
        'GMB Profiles',
        'Directories',
        'Social Media',
        'Local Websites',
        'MARKET OPPORTUNITY REPORT',
    ]
    print("Static translation tests:")
    for t in tests:
        result = translate(t)
        source = 'STATIC' if t in STATIC_TRANSLATIONS else 'API'
        print(f"  [{source}] {t!r} -> {result!r}")

    print()

    # Test API translations
    api_tests = [
        'Every month people search for gyms on Google.',
        'You are currently visible on Google.',
        'The cost of not being found online.',
        'Book a free consultation today.',
        'Without a digital presence every search ends at someone else\'s door.',
    ]
    print("API translation tests:")
    for t in api_tests:
        result = translate(t)
        print(f"  {t!r}")
        print(f"  -> {result!r}")
        print()

    print("All tests complete.")
