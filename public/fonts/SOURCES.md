# Public font sources and reference analysis

ACADEMIX uses Barlow by the Barlow Project Authors under SIL Open Font License 1.1. It is self-hosted, so public pages do not depend on a third-party font service.

Barlow Regular and SemiBold were obtained on 8 October 2026 from the official Google Fonts repository:
- https://github.com/google/fonts/tree/main/ofl/barlow
- https://raw.githubusercontent.com/google/fonts/main/ofl/barlow/Barlow-Regular.ttf
- https://raw.githubusercontent.com/google/fonts/main/ofl/barlow/Barlow-SemiBold.ttf
- License: OFL-Barlow.txt (distributed alongside the unmodified fonts).

Barlow Condensed Regular and SemiBold are existing reconstruction assets; their license is OFL-BarlowCondensed.txt.

The live ISZL page was inspected in a browser on 6 October 2026. The saved page markup at `tmp/iszl-dom.html` preloads the site's `din-2014_regular.woff`, `din-2014_demi.woff`, and `din-2014_bold.woff` assets. The computed-style capture at `tmp/iszl-1440-geometry.json` reports `Din, sans-serif` for body text and `HeadingNow-Regular, sans-serif` for headings. The official ISZL Design & Style Manual (version 2, updated August 2017), page 9, also specifies DIN for the website. ISZL's later website-launch article confirms a deliberate typography refresh but does not identify the font families.

The proprietary DIN and HeadingNow fonts have not been copied or redistributed. ACADEMIX uses the existing licensed Barlow Regular/SemiBold faces as a close body-text substitute for DIN and Barlow Condensed Regular/SemiBold as the display-heading substitute for HeadingNow. These are approximations, so exact glyph shapes and text metrics differ. A direct fetch of the live homepage timed out during the current pass; the family identification is supported by the retained browser capture from 6 October, not by a fresh computed-style capture today.

Reference sources:
- https://resources.finalsite.net/images/v1649065956/zug/qumphpcxhmnhzmxq0osd/ISZLBrandBook.pdf
- https://www.iszl.ch/news-events/news/our-new-website/
- https://github.com/google/fonts/tree/main/ofl/barlow
