# -*- coding: utf-8 -*-
"""Language-keyed copy for the 5-page report design.

EN = the exact strings the original generator used (so English never regresses).
KN = owner's Gemini Kannada pass on this design's copy.

Placeholders: {volume} {city} {niche} {niche_l} (lowercased niche, EN only)
              {count} {reviews}  (filled per-element at draw time)
Headlines + page4 box labels are lists of lines. EN box labels keep their
'\n' splits; KN box labels are single strings (wrapped to width at draw time).
"""

SHARED = {
    "en": {
        "hero_label": "monthly searches for {niche_l} in {city}",
        "source_tag": "SOURCE: Google Keyword Planner",
        "page2_header": "The Search Demand in {city}",
        "page2_intro": "Every month {volume} people in {city} search for {niche_l} on Google.",
        "page2_verified": "Verified data from Google Keyword Planner — the same tool Google uses for its own platform.",
        "where_traffic_goes": "WHERE THIS TRAFFIC GOES",
        "bar_gmb": "GMB Profiles",
        "bar_directories": "Directories (JustDial etc.)",
        "bar_social": "Social Media",
        "bar_websites": "Local Websites",
        "searches_per_month": "{count} searches/month",
        "page3_header": "Who Is Getting This Traffic Right Now",
        "gbp_top3_label": "GOOGLE BUSINESS PROFILE — TOP 3 RESULTS",
        "gbp_capture_line": "These 3 businesses capture an estimated {count} searches every month through Google Maps",
        "directories_capture": "DIRECTORIES — CAPTURING {count} SEARCHES",
        "websites_capture": "LOCAL WEBSITES — CAPTURING {count} SEARCHES",
        "reviews_suffix": "({reviews} reviews)",
        "dir_item": "{niche} listings",
        "web_item": "{niche} website",
        "cta_headline": ["Let's Talk About", "Your Growth"],
        "cta_sub": ["Book a free consultation to discuss the opportunity,",
                    "scope, and how you can grow your business"],
        "cta_button": "Book Your Free Consultation",
        "tagline": "Marketing That Pays You Back",
    },
    "kn": {
        "hero_label": "{city} ನಲ್ಲಿ {niche} ನ ತಿಂಗಳ ಹುಡುಕಾಟಗಳು",
        "source_tag": "ಮೂಲ: Google Keyword Planner",
        "page2_header": "{city} ನಲ್ಲಿ ಹುಡುಕಾಟದ ಬೇಡಿಕೆ",
        "page2_intro": "ಪ್ರತಿ ತಿಂಗಳು {city} ನಲ್ಲಿ {volume} ಜನರು Google ನಲ್ಲಿ {niche} ಗಾಗಿ ಹುಡುಕುತ್ತಾರೆ.",
        "page2_verified": "Google Keyword Planner ನಿಂದ ಖಚಿತಪಡಿಸಿದ ಮಾಹಿತಿ — Google ತನ್ನ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ಗೆ ಬಳಸುವ ಅದೇ ಸಾಧನ.",
        "where_traffic_goes": "ಈ ಟ್ರಾಫಿಕ್ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತದೆ",
        "bar_gmb": "GMB ಪ್ರೊಫೈಲ್‌ಗಳು",
        "bar_directories": "ಡೈರೆಕ್ಟರಿಗಳು (JustDial ಇತ್ಯಾದಿ)",
        "bar_social": "ಸೋಶಿಯಲ್ ಮೀಡಿಯಾ",
        "bar_websites": "ಲೋಕಲ್ ವೆಬ್‌ಸೈಟ್‌ಗಳು",
        "searches_per_month": "ತಿಂಗಳಿಗೆ {count} ಹುಡುಕಾಟಗಳು",
        "page3_header": "ಈಗ ಈ ಟ್ರಾಫಿಕ್ ಯಾರಿಗೆ ಸಿಗುತ್ತಿದೆ",
        "gbp_top3_label": "Google Business Profile — ಟಾಪ್ 3 ರಿಸಲ್ಟ್‌ಗಳು",
        "gbp_capture_line": "ಈ 3 ಬಿಸಿನೆಸ್‌ಗಳು Google Maps ಮೂಲಕ ಪ್ರತಿ ತಿಂಗಳು ಅಂದಾಜು {count} ಹುಡುಕಾಟಗಳನ್ನು ಪಡೆಯುತ್ತವೆ",
        "directories_capture": "ಡೈರೆಕ್ಟರಿಗಳು — {count} ಹುಡುಕಾಟಗಳನ್ನು ಪಡೆಯುತ್ತಿವೆ",
        "websites_capture": "ಲೋಕಲ್ ವೆಬ್‌ಸೈಟ್‌ಗಳು — {count} ಹುಡುಕಾಟಗಳನ್ನು ಪಡೆಯುತ್ತಿವೆ",
        "reviews_suffix": "({reviews} ರಿವ್ಯೂಗಳು)",
        "dir_item": "{niche} ಲಿಸ್ಟಿಂಗ್‌ಗಳು",
        "web_item": "{niche} ವೆಬ್‌ಸೈಟ್",
        "cta_headline": ["ನಿಮ್ಮ ಬಿಸಿನೆಸ್ ಬೆಳವಣಿಗೆಯ ಬಗ್ಗೆ ಮಾತಾಡೋಣ"],
        "cta_sub": ["ಅವಕಾಶಗಳು ಮತ್ತು ನಿಮ್ಮ ಬಿಸಿನೆಸ್ ಹೇಗೆ ಬೆಳೆಸಬಹುದು ಎಂದು",
                    "ಚರ್ಚಿಸಲು ಉಚಿತ ಕನ್ಸಲ್ಟೇಶನ್ ಬುಕ್ ಮಾಡಿ"],
        "cta_button": "ನಿಮ್ಮ ಉಚಿತ ಕನ್ಸಲ್ಟೇಶನ್ ಬುಕ್ ಮಾಡಿ",
        "tagline": "ನಿಮಗೆ ಲಾಭ ತರುವ ಮಾರ್ಕೆಟಿಂಗ್",
    },
}

TYPES = {
    "en": {
        "A": {
            "badge": "VISIBILITY REPORT",
            "headline": ["You Are Already on", "Google Page 1"],
            "subheadline": "Here is what that visibility is worth — and what you could be capturing",
            "cover_callout_1": "You are currently visible. The opportunity is to maximise",
            "cover_callout_2": "every search that finds you.",
            "page2_callout_1": "You are capturing a share of this traffic.",
            "page2_callout_2": "The question is — how much more could you capture?",
            "page4_headline": "What You Could Still Be Capturing",
            "page4_box_labels": ["people see a GMB profile —\nare they seeing yours first?",
                                 "searches go to directories —\nare you listed and optimised?",
                                 "people visit local websites —\nis yours converting them?"],
            "page4_insight_1": "Being on Page 1 is the first step. Owning that position",
            "page4_insight_2": "and converting every visit is the next.",
            "page4_sub": "Maximise every search that finds you by strengthening each channel.",
        },
        "B": {
            "badge": "WEBSITE PERFORMANCE REPORT",
            "headline": ["{volume} People Searched", "For {niche} in {city}", "Last Month"],
            "subheadline": "Your website exists — but it was not in these results",
            "cover_callout_1": "Having a website and being found on Google",
            "cover_callout_2": "are two different things",
            "page2_callout_1": "You have a website. But Google is not surfacing it",
            "page2_callout_2": "when people search for your services.",
            "page4_headline": "The Gap Between Your Website and Google",
            "page4_box_labels": ["people searched on Google Maps —\nyour GMB needs optimisation",
                                 "searches went to directories —\nis your business listed?",
                                 "people visited local websites —\nyours was not one of them"],
            "page4_insight_1": "Your website is built. The next step is making Google",
            "page4_insight_2": "surface it when {volume} people search every month.",
            "page4_sub": "SEO and GMB optimisation closes the gap between your site and your customers.",
        },
        "C": {
            "badge": "MARKET OPPORTUNITY REPORT",
            "headline": ["{volume} People Searched", "For {niche} in {city}", "Last Month"],
            "subheadline": "Here is exactly where that search traffic is going right now",
            "cover_callout_1": "This report shows where your potential customers are going",
            "cover_callout_2": "and what it would take for them to find you instead",
            "page2_callout_1": "Right now 100% of this traffic is going to other businesses",
            "page2_callout_2": "Every search that goes unanswered is a customer walking into your competitor",
            "page4_headline": "The Cost of Not Being Found",
            "page4_box_labels": ["people clicked a GMB\nprofile this month",
                                 "searches went to\nJustDial and directories",
                                 "people visited local\n{niche_l} websites"],
            "page4_insight_1": "Without a digital presence, every one of these",
            "page4_insight_2": "{volume} monthly searches ends at someone else's door.",
            "page4_sub": "A complete digital presence means showing up where these searches land.",
        },
        "D": {
            "badge": "NICHE MARKET REPORT",
            "headline": ["Only {volume} People", "Search For {niche}", "in {city} Every Month"],
            "subheadline": "Every single one of them is ready to buy — here is how to capture them all",
            "cover_callout_1": "Small market. High intent. Low competition.",
            "cover_callout_2": "Every search matters.",
            "page2_callout_1": "In a focused market every single search is a potential customer",
            "page2_callout_2": "with a specific need — and low competition to beat.",
            "page4_headline": "The Small Market Advantage",
            "page4_box_labels": ["GMB clicks per month —\na strong profile captures all",
                                 "directory searches —\nlow competition, easy visibility",
                                 "website visitors —\nhigh intent, ready to buy"],
            "page4_insight_1": "Small volume means less competition. The businesses showing up",
            "page4_insight_2": "now are not heavily optimised — the bar to rank is lower.",
            "page4_sub": "In a niche market, one strong digital presence can dominate all search results.",
        },
    },
    "kn": {
        "A": {
            "badge": "ಗೋಚರತೆ ವರದಿ",
            "headline": ["ನೀವು ಈಗಾಗಲೇ ಇಲ್ಲಿದ್ದೀರಿ", "Google ನ 1ನೇ ಪುಟ"],
            "subheadline": "ಈ ಗೋಚರತೆಯ ಮೌಲ್ಯವೇನು — ಮತ್ತು ನೀವು ಇನ್ನೂ ಎಷ್ಟು ಲಾಭ ಪಡೆಯಬಹುದು ಎಂಬುದು ಇಲ್ಲಿದೆ",
            "cover_callout_1": "ನೀವು ಪ್ರಸ್ತುತ ಜನರಿಗೆ ಕಾಣುತ್ತಿದ್ದೀರಿ. ನಿಮ್ಮ ಅವಕಾಶವೆಂದರೆ",
            "cover_callout_2": "ನಿಮ್ಮನ್ನು ಹುಡುಕುವ ಪ್ರತಿಯೊಬ್ಬರಿಂದಲೂ ಗರಿಷ್ಠ ಲಾಭ ಪಡೆಯುವುದು.",
            "page2_callout_1": "ಈ ಟ್ರಾಫಿಕ್‌ನ ಒಂದು ಭಾಗ ನಿಮಗೆ ಸಿಗುತ್ತಿದೆ.",
            "page2_callout_2": "ಪ್ರಶ್ನೆ ಏನೆಂದರೆ — ನೀವು ಇನ್ನೂ ಎಷ್ಟು ಹೆಚ್ಚು ಪಡೆಯಬಹುದು?",
            "page4_headline": "ನೀವು ಇನ್ನೂ ಏನನ್ನು ಪಡೆಯಬಹುದು",
            "page4_box_labels": ["ಜನರು GMB ಪ್ರೊಫೈಲ್ ನೋಡುತ್ತಾರೆ — ಅವರು ಮೊದಲು ನಿಮ್ಮದನ್ನು ನೋಡುತ್ತಿದ್ದಾರೆಯೇ?",
                                 "ಹುಡುಕಾಟಗಳು ಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಹೋಗುತ್ತವೆ — ನಿಮ್ಮ ಬಿಸಿನೆಸ್ ಅಲ್ಲಿ ಸರಿಯಾಗಿ ಲಿಸ್ಟ್ ಆಗಿದೆಯೇ?",
                                 "ಜನರು ಲೋಕಲ್ ವೆಬ್‌ಸೈಟ್‌ಗಳಿಗೆ ಭೇಟಿ ನೀಡುತ್ತಾರೆ — ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಅವರನ್ನು ಗ್ರಾಹಕರನ್ನಾಗಿ ಮಾಡುತ್ತಿದೆಯೇ?"],
            "page4_insight_1": "1ನೇ ಪುಟದಲ್ಲಿರುವುದು ಮೊದಲ ಹೆಜ್ಜೆ. ಆ ಸ್ಥಾನವನ್ನು ಉಳಿಸಿಕೊಂಡು",
            "page4_insight_2": "ಪ್ರತಿಯೊಬ್ಬರನ್ನು ಗ್ರಾಹಕರನ್ನಾಗಿ ಮಾಡುವುದು ಮುಂದಿನ ಹೆಜ್ಜೆ.",
            "page4_sub": "ಪ್ರತಿಯೊಂದು ಚಾನಲ್ ಅನ್ನು ಬಲಪಡಿಸುವ ಮೂಲಕ ನಿಮ್ಮನ್ನು ಹುಡುಕುವ ಎಲ್ಲರನ್ನೂ ಗ್ರಾಹಕರನ್ನಾಗಿ ಬದಲಾಯಿಸಿ.",
        },
        "B": {
            "badge": "ವೆಬ್‌ಸೈಟ್ ಕಾರ್ಯಕ್ಷಮತೆಯ ವರದಿ",
            "headline": ["{volume} ಜನರು ಹುಡುಕಿದ್ದಾರೆ", "{city} ನಲ್ಲಿ {niche} ಗಾಗಿ", "ಕಳೆದ ತಿಂಗಳು"],
            "subheadline": "ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಇದೆ — ಆದರೆ ಅದು ಈ ರಿಸಲ್ಟ್‌ಗಳಲ್ಲಿ ಇರಲಿಲ್ಲ",
            "cover_callout_1": "ವೆಬ್‌ಸೈಟ್ ಇರುವುದು ಮತ್ತು Google ನಲ್ಲಿ ಸಿಗುವುದು",
            "cover_callout_2": "ಎರಡೂ ಬೇರೆ ಬೇರೆ ವಿಷಯಗಳು",
            "page2_callout_1": "ನಿಮ್ಮ ಬಳಿ ವೆಬ್‌ಸೈಟ್ ಇದೆ. ಆದರೆ Google ಅದನ್ನು",
            "page2_callout_2": "ಜನರು ನಿಮ್ಮ ಸೇವೆಗಳಿಗಾಗಿ ಹುಡುಕಿದಾಗ ತೋರಿಸುತ್ತಿಲ್ಲ.",
            "page4_headline": "ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಮತ್ತು Google ನಡುವಿನ ಅಂತರ",
            "page4_box_labels": ["ಜನರು Google Maps ನಲ್ಲಿ ಹುಡುಕಿದ್ದಾರೆ — ನಿಮ್ಮ GMB ಸರಿಪಡಿಸಬೇಕಿದೆ",
                                 "ಹುಡುಕಾಟಗಳು ಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಹೋಗಿವೆ — ನಿಮ್ಮ ಬಿಸಿನೆಸ್ ಲಿಸ್ಟ್ ಆಗಿದೆಯೇ?",
                                 "ಜನರು ಲೋಕಲ್ ವೆಬ್‌ಸೈಟ್‌ಗಳಿಗೆ ಭೇಟಿ ನೀಡಿದ್ದಾರೆ — ನಿಮ್ಮದು ಅವುಗಳಲ್ಲಿ ಇರಲಿಲ್ಲ"],
            "page4_insight_1": "ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ರೆಡಿ ಇದೆ. ಪ್ರತಿ ತಿಂಗಳು {volume} ಜನರು ಹುಡುಕಿದಾಗ",
            "page4_insight_2": "Google ಅದನ್ನು ತೋರಿಸುವಂತೆ ಮಾಡುವುದು ಮುಂದಿನ ಹೆಜ್ಜೆ.",
            "page4_sub": "SEO ಮತ್ತು GMB ಆಪ್ಟಿಮೈಸೇಶನ್ ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ಮತ್ತು ನಿಮ್ಮ ಗ್ರಾಹಕರ ನಡುವಿನ ಅಂತರವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.",
        },
        "C": {
            "badge": "ಮಾರುಕಟ್ಟೆ ಅವಕಾಶದ ವರದಿ",
            "headline": ["{volume} ಜನರು ಹುಡುಕಿದ್ದಾರೆ", "{city} ನಲ್ಲಿ {niche} ಗಾಗಿ", "ಕಳೆದ ತಿಂಗಳು"],
            "subheadline": "ಆ ಹುಡುಕಾಟದ ಟ್ರಾಫಿಕ್ ಈಗ ನಿಖರವಾಗಿ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದೆ ಎಂಬುದು ಇಲ್ಲಿದೆ",
            "cover_callout_1": "ನಿಮ್ಮ ಗ್ರಾಹಕರು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದಾರೆ ಎಂದು ಈ ವರದಿ ತೋರಿಸುತ್ತದೆ",
            "cover_callout_2": "ಮತ್ತು ಅದರ ಬದಲು ಅವರು ನಿಮ್ಮನ್ನು ಹುಡುಕಿ ಬರಲು ಏನು ಮಾಡಬೇಕು",
            "page2_callout_1": "ಈಗ ಈ ಟ್ರಾಫಿಕ್‌ನ 100% ಬೇರೆ ಬಿಸಿನೆಸ್‌ಗಳಿಗೆ ಹೋಗುತ್ತಿದೆ",
            "page2_callout_2": "ನಿಮಗೆ ಸಿಗದ ಪ್ರತಿಯೊಂದು ಹುಡುಕಾಟವು, ಗ್ರಾಹಕರು ನಿಮ್ಮ ಪ್ರತಿಸ್ಪರ್ಧಿಯ ಬಳಿ ಹೋದಂತೆ",
            "page4_headline": "ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಸಿಗದೆ ಇರುವುದರಿಂದ ಆಗುವ ನಷ್ಟ",
            "page4_box_labels": ["ಜನರು ಈ ತಿಂಗಳು GMB ಪ್ರೊಫೈಲ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿದ್ದಾರೆ",
                                 "ಹುಡುಕಾಟಗಳು JustDial ಮತ್ತು ಡೈರೆಕ್ಟರಿಗಳಿಗೆ ಹೋಗಿವೆ",
                                 "ಜನರು ಲೋಕಲ್ {niche} ವೆಬ್‌ಸೈಟ್‌ಗಳಿಗೆ ಭೇಟಿ ನೀಡಿದ್ದಾರೆ"],
            "page4_insight_1": "ಡಿಜಿಟಲ್ ಗುರುತು ಇಲ್ಲದಿದ್ದರೆ, ಈ ಪ್ರತಿಯೊಂದು",
            "page4_insight_2": "{volume} ತಿಂಗಳ ಹುಡುಕಾಟಗಳು ಬೇರೆಯವರ ಬಿಸಿನೆಸ್ ಸೇರುತ್ತವೆ.",
            "page4_sub": "ಪೂರ್ಣ ಡಿಜಿಟಲ್ ಗುರುತು ಎಂದರೆ ಈ ಹುಡುಕಾಟಗಳು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತವೆಯೋ ಅಲ್ಲಿ ನೀವು ಕಾಣಿಸಿಕೊಳ್ಳುವುದು.",
        },
        "D": {
            "badge": "ನಿರ್ದಿಷ್ಟ ಮಾರುಕಟ್ಟೆ ವರದಿ",
            "headline": ["ಕೇವಲ {volume} ಜನರು", "{niche} ಗಾಗಿ ಹುಡುಕುತ್ತಾರೆ", "{city} ನಲ್ಲಿ ಪ್ರತಿ ತಿಂಗಳು"],
            "subheadline": "ಅವರೆಲ್ಲರೂ ಖರೀದಿಸಲು ಸಿದ್ಧರಾಗಿದ್ದಾರೆ — ಅವರೆಲ್ಲರನ್ನೂ ಪಡೆಯುವುದು ಹೇಗೆ ಎಂಬುದು ಇಲ್ಲಿದೆ",
            "cover_callout_1": "ಸಣ್ಣ ಮಾರುಕಟ್ಟೆ. ಕೊಳ್ಳುವ ಆಸಕ್ತಿ. ಕಡಿಮೆ ಪೈಪೋಟಿ.",
            "cover_callout_2": "ಪ್ರತಿಯೊಂದು ಹುಡುಕಾಟವೂ ಮುಖ್ಯ.",
            "page2_callout_1": "ಇಂತಹ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಪ್ರತಿಯೊಂದು ಹುಡುಕಾಟವೂ ಒಬ್ಬ ಗ್ರಾಹಕರಾಗಬಹುದು",
            "page2_callout_2": "ಅವರಿಗೆ ನಿರ್ದಿಷ್ಟ ಅಗತ್ಯವಿರುತ್ತದೆ — ಮತ್ತು ನಿಮ್ಮ ಪೈಪೋಟಿ ಕೂಡ ಕಡಿಮೆಯಿರುತ್ತದೆ.",
            "page4_headline": "ಸಣ್ಣ ಮಾರುಕಟ್ಟೆಯ ಲಾಭಗಳು",
            "page4_box_labels": ["ತಿಂಗಳಿಗೆ GMB ಕ್ಲಿಕ್‌ಗಳು — ಒಂದು ಒಳ್ಳೆ ಪ್ರೊಫೈಲ್ ಎಲ್ಲರನ್ನೂ ಸೆಳೆಯುತ್ತದೆ",
                                 "ಡೈರೆಕ್ಟರಿ ಹುಡುಕಾಟಗಳು — ಕಡಿಮೆ ಪೈಪೋಟಿ, ಸುಲಭವಾಗಿ ಕಾಣಬಹುದು",
                                 "ವೆಬ್‌ಸೈಟ್ ಭೇಟಿಗಾರರು — ಹೆಚ್ಚಿನ ಆಸಕ್ತಿ, ಖರೀದಿಸಲು ಸಿದ್ಧ"],
            "page4_insight_1": "ಸಣ್ಣ ಸಂಖ್ಯೆ ಎಂದರೆ ಕಡಿಮೆ ಪೈಪೋಟಿ. ಈಗ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತಿರುವ ಬಿಸಿನೆಸ್‌ಗಳು",
            "page4_insight_2": "ಅಷ್ಟೊಂದು ಆಪ್ಟಿಮೈಸ್ ಆಗಿಲ್ಲ — ರ್ಯಾಂಕ್ ಪಡೆಯುವುದು ಸುಲಭ.",
            "page4_sub": "ನಿರ್ದಿಷ್ಟ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ, ನಿಮ್ಮ ಒಂದು ಸ್ಟ್ರಾಂಗ್ ಡಿಜಿಟಲ್ ಗುರುತು ಎಲ್ಲಾ ರಿಸಲ್ಟ್‌ಗಳನ್ನೂ ಆಳಬಹುದು.",
        },
    },
}


# page-4 "Growth Partner" block. Service icon codes + titles stay English
# (brand/service names); descriptions + section + blurb + captions translate.
# NOTE: KN here is Claude-drafted (low-risk brand-heavy strings) pending an
# optional owner/Gemini wording review.
GROWTH = {
    "en": {
        "card_subs": ["None of them were yours", "JustDial owns that customer",
                      "Your competitor — not you"],
        "section": "YOUR GROWTH PARTNER — NOT JUST AN AGENCY",
        "blurb": ["FortuneMarq builds and manages your complete online presence — so you focus on",
                  "running your business while customers find you on Google."],
        "services": [
            ("GMB", "Google Business\nProfile", "Get found on\nGoogle Maps"),
            ("WEB", "Business\nWebsite", "Convert visitors\ninto calls"),
            ("SEO", "Local SEO", "Rank higher on\nGoogle organically"),
            ("ADS", "Google Ads", "Top of Google\ninstantly"),
            ("META", "Meta Ads", "Instagram &\nFacebook reach"),
            ("RPT", "Monthly\nReports", "Clear ROI report\nevery month"),
        ],
    },
    "kn": {
        "card_subs": ["ಅವರಲ್ಲಿ ಯಾರೂ ನಿಮ್ಮವರಲ್ಲ", "JustDial ಆ ಗ್ರಾಹಕರನ್ನು ಪಡೆಯಿತು",
                      "ನಿಮ್ಮ ಪ್ರತಿಸ್ಪರ್ಧಿ — ನೀವಲ್ಲ"],
        "section": "ನಿಮ್ಮ ಬೆಳವಣಿಗೆಯ ಪಾಲುದಾರ — ಕೇವಲ ಏಜೆನ್ಸಿ ಅಲ್ಲ",
        "blurb": ["FortuneMarq ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಆನ್‌ಲೈನ್ ಗುರುತನ್ನು ಕಟ್ಟಿ ನಿರ್ವಹಿಸುತ್ತದೆ — ಹಾಗಾಗಿ",
                  "ನೀವು ಬಿಸಿನೆಸ್ ಮೇಲೆ ಗಮನ ಹರಿಸಿ, ಗ್ರಾಹಕರು Google ನಲ್ಲಿ ನಿಮ್ಮನ್ನು ಹುಡುಕಲಿ."],
        "services": [
            ("GMB", "Google Business\nProfile", "Google Maps ನಲ್ಲಿ\nಕಾಣಿಸಿಕೊಳ್ಳಿ"),
            ("WEB", "Business\nWebsite", "ಭೇಟಿಗಾರರನ್ನು\nಕರೆಗಳಾಗಿ ಬದಲಿಸಿ"),
            ("SEO", "Local SEO", "Google ನಲ್ಲಿ\nಮೇಲಕ್ಕೆ ಬನ್ನಿ"),
            ("ADS", "Google Ads", "Google ನ ಮೇಲ್ಭಾಗದಲ್ಲಿ\nತಕ್ಷಣ"),
            ("META", "Meta Ads", "Instagram &\nFacebook ರೀಚ್"),
            ("RPT", "Monthly\nReports", "ಪ್ರತಿ ತಿಂಗಳು\nಸ್ಪಷ್ಟ ROI ವರದಿ"),
        ],
    },
}


class _Safe(dict):
    def __missing__(self, k):
        return "{" + k + "}"


def fmt(s, **kw):
    """str.format that leaves unknown placeholders intact."""
    return s.format_map(_Safe(**kw))
