# Kayman Constructions website

Static website for Kayman Constructions: remodeling, renovation and residential construction in Greater Houston.

- `index.html`: home page with the scroll-driven walkthrough video (`walk.js`)
- `content.py`: services, areas, projects and About text
- `build.py`: generates `services/`, `areas/`, `projects/`, `about.html`, `sitemap.xml` and the shared header and footer

To change content, edit `content.py` and run:

    python3 build.py

To preview locally:

    python3 -m http.server

Walkthrough footage by Kindel Media on Pexels. Sample project photos from Unsplash (replace with real Kayman projects).
