"""
Builds the service, area and project pages from content.py, and refreshes the
shared header, footer and generated sections of index.html.

    python3 build.py
"""
import json
import re
from html import escape as e
from pathlib import Path

from content import ABOUT, AREAS, BRAND, CONTACTS, PHONE, PHONE_TEL, PROJECTS, SERVICES, SITE_URL, TAGLINE

ROOT = Path(__file__).parent
SERVICE = {s['slug']: s for s in SERVICES}
AREA = {a['slug']: a for a in AREAS}

GROUPS = {
    'Remodeling': 'Change how a room works: new layouts, plumbing and wiring moved, finished with materials you pick.',
    'Renovation': 'Bring an older house up to today. We fix what’s behind the walls before we finish what’s in front of them.',
    'Residential construction': 'Build new, or build more, from permit set to move-in.',
}


# The Kayman mark (K, roof, chimney and window), redrawn from the logo as a vector
LOGO_MARK = ('<svg class="brand-mark" viewBox="470 120 690 515" aria-hidden="true">'
             '<g fill="currentColor">'
             '<path d="M480 130 565 192V410L480 495Z"/>'
             '<path d="M750 235H850L480 605V505Z"/>'
             '<path d="M480 615 565 530V625H480Z"/>'
             '<path d="M592 505 650 447 826 625H734Z"/>'
             '<path d="M932 358 985 336H1015V487L932 408Z"/>'
             '<path d="M895 503 1018 625H895Z"/>'
             '<path d="M742 452h24v24h-24zM771 452h24v24h-24zM742 481h24v24h-24zM771 481h24v24h-24z"/>'
             '</g>'
             '<path class="brand-roof" d="M805 298 1140 622H1030L752 354Z"/>'
             '</svg>')


def todo(text):
    """Escape text and highlight [[placeholders]] the founders still need to fill in."""
    return re.sub(r'\[\[(.+?)\]\]', r'<mark class="todo">\1</mark>', e(text))


def url(path):
    return f'{SITE_URL}/{path}'.replace('/index.html', '/')


# ---------------------------------------------------------------- shared parts

def header(p):
    return f'''<header class="site-header">
  <a class="brand" href="{p}index.html" aria-label="{BRAND} home">
    {LOGO_MARK}
    <span class="brand-name">Kayman <span>Constructions</span></span>
  </a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu"><span></span><span></span><span></span></button>
  <nav class="site-nav" id="site-nav" aria-label="Main">
    <a href="{p}services/index.html">Services</a>
    <a href="{p}projects/index.html">Projects</a>
    <a href="{p}areas/index.html">Service area</a>
    <a href="{p}about.html">About</a>
    <a class="nav-call" href="tel:{PHONE_TEL}">Call {PHONE}</a>
  </nav>
  <a class="header-cta" href="{p}index.html#contact">Book a walkthrough</a>
</header>'''


def footer(p):
    contacts = '<dl class="footer-contacts">' + ''.join(
        f'<div><dt>{c["name"]}</dt><dd><a href="tel:{c["tel"]}">{c["phone"]}</a><br>'
        f'<a href="mailto:{c["email"]}">{c["email"]}</a></dd></div>' for c in CONTACTS) + '</dl>'
    services = ''.join(f'<li><a href="{p}services/{s["slug"]}.html">{e(s["name"])}</a></li>' for s in SERVICES)
    areas = ''.join(f'<li><a href="{p}areas/{a["slug"]}.html">{e(a["name"])}</a></li>' for a in AREAS)
    return f'''<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-about">
      <p class="footer-brand">{LOGO_MARK}<span>{BRAND}</span></p>
      <p class="footer-tagline">{TAGLINE}</p>
      <p>Remodeling, renovation and residential construction in Greater Houston, Texas.</p>
      {contacts}
      <p>Licensed and insured. &copy; 2026 {BRAND}.</p>
    </div>
    <nav aria-label="Services"><p class="footer-head">Services</p><ul>{services}</ul></nav>
    <nav aria-label="Service area"><p class="footer-head">Service area</p><ul>{areas}</ul></nav>
    <nav aria-label="Company"><p class="footer-head">Company</p><ul>
      <li><a href="{p}about.html">About us</a></li>
      <li><a href="{p}projects/index.html">Projects</a></li>
      <li><a href="{p}index.html#process">How we work</a></li>
      <li><a href="{p}index.html#contact">Book a walkthrough</a></li>
    </ul></nav>
  </div>
  <p class="wrap footer-credit">Walkthrough footage by Kindel Media on Pexels. Sample project photos from Unsplash. 3D workers from Microsoft Rocketbox (MIT licence).</p>
</footer>'''


def business_jsonld():
    return {
        '@context': 'https://schema.org',
        '@type': 'HomeAndConstructionBusiness',
        'name': BRAND,
        'slogan': TAGLINE,
        'url': SITE_URL + '/',
        'logo': SITE_URL + '/img/brand/kayman-logo.png',
        'image': SITE_URL + '/img/brand/kayman-logo-share.jpg',
        'telephone': PHONE,
        'email': CONTACTS[0]['email'],
        'employee': [{'@type': 'Person', 'name': c['name'], 'email': c['email'], 'telephone': c['phone']} for c in CONTACTS],
        'areaServed': [{'@type': 'Place', 'name': f'{a["name"]}, TX'} for a in AREAS],
        'address': {'@type': 'PostalAddress', 'addressLocality': 'Houston', 'addressRegion': 'TX', 'addressCountry': 'US'},
    }


def page(path, title, description, body, noindex=False, jsonld=()):
    depth = path.count('/')
    p = '../' * depth
    robots = '\n  <meta name="robots" content="noindex">' if noindex else ''
    ld = ''.join(f'\n  <script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in jsonld)
    html = f'''<!doctype html>
<html lang="en" data-theme="yellow">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(title)}</title>
  <meta name="description" content="{e(description)}">
  <link rel="canonical" href="{url(path)}">{robots}
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="{BRAND}">
  <meta property="og:image" content="{SITE_URL}/img/brand/kayman-logo-share.jpg">
  <link rel="icon" href="{p}favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{p}styles.css?v=20261025000446">{ld}
</head>
<body class="subpage">
{header(p)}
<main>
{body(p)}
</main>
{footer(p)}
<script src="{p}site.js?v=20261025000446"></script>
</body>
</html>
'''
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    return path


def crumbs(p, trail):
    items = [('Home', f'{p}index.html')] + [(label, p + href) for label, href in trail]
    links = []
    for i, (label, href) in enumerate(items):
        last = i == len(items) - 1
        links.append(f'<li><span aria-current="page">{e(label)}</span></li>' if last else f'<li><a href="{href}">{e(label)}</a></li>')
    return f'<nav class="crumbs wrap" aria-label="Breadcrumb"><ol>{"".join(links)}</ol></nav>'


def crumbs_ld(trail):
    items = [('Home', 'index.html')] + trail
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': label, 'item': url(path)}
            for i, (label, path) in enumerate(items)
        ],
    }


def img(p, name, alt, cls='', sizes='(max-width: 800px) 100vw, 50vw', eager=False):
    loading = '' if eager else ' loading="lazy"'
    return (f'<img class="{cls}" src="{p}img/projects/{name}.jpg" '
            f'srcset="{p}img/projects/{name}-sm.jpg 720w, {p}img/projects/{name}.jpg 1600w" '
            f'sizes="{sizes}" alt="{e(alt)}" width="1600" height="1067"{loading} decoding="async">')


def project_card(p, pr):
    after = next(ph for ph in pr['photos'] if ph[1] == 'After')
    before = next(ph for ph in pr['photos'] if ph[1] == 'Before')
    # hovering the card wipes from the after photo to the before photo
    return f'''<a class="project-card" href="{p}projects/{pr["slug"]}.html">
  <span class="card-media">
    {img(p, after[0], after[2], sizes='(max-width: 700px) 100vw, 33vw')}
    {img(p, before[0], '', 'card-before', '(max-width: 700px) 100vw, 33vw')}
    <span class="card-tag" aria-hidden="true">Before</span>
  </span>
  <span class="project-card-body">
    <span class="project-card-meta">{e(SERVICE[pr["service"]]["name"])}, {e(AREA[pr["area"]]["name"])}</span>
    <span class="project-card-title">{e(pr["title"])}</span>
    <span class="project-card-text">{e(pr["summary"])}</span>
  </span>
</a>'''


def project_grid(p, projects):
    return '<div class="project-grid">' + ''.join(project_card(p, pr) for pr in projects) + '</div>'


def sample_note(pr):
    if not pr['sample']:
        return ''
    return ('<p class="sample-note">Sample project. The photos are stock images showing the kind of work described, '
            'not this specific house. Replace them with real Kayman project photos before launch.</p>')


def ba_slider(p, pr):
    before = next(ph for ph in pr['photos'] if ph[1] == 'Before')
    after = next(ph for ph in pr['photos'] if ph[1] == 'After')
    return f'''<figure class="ba">
  <div class="ba-frame">
    {img(p, after[0], after[2], 'ba-after', '(max-width: 1100px) 100vw, 1100px', eager=True)}
    <div class="ba-before">{img(p, before[0], before[2], '', '(max-width: 1100px) 100vw, 1100px', eager=True)}</div>
    <span class="ba-label ba-label-before" aria-hidden="true">Before</span>
    <span class="ba-label ba-label-after" aria-hidden="true">After</span>
    <span class="ba-handle" aria-hidden="true"></span>
    <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Compare before and after: drag left to see more of the after photo">
  </div>
  <figcaption>Drag the handle to compare before and after.</figcaption>
</figure>'''


def mini_map(highlight=None):
    dots = ''
    for a in AREAS:
        x, y = a['xy']
        on = a['slug'] == highlight
        dots += f'<circle cx="{x}" cy="{y}" r="{7 if on else 3.5}" class="{"dot-on" if on else "dot"}"/>'
        if on:
            dots += f'<text x="{x + 12}" y="{y + 5}" class="dot-label">{e(a["name"])}</text>'
    return f'''<svg class="mini-map" viewBox="0 0 400 400" role="img" aria-label="Map of Greater Houston{" showing " + e(AREA[highlight]["name"]) if highlight else ""}">
  <circle cx="200" cy="200" r="186" class="ring ring-99"/>
  <circle cx="200" cy="200" r="118" class="ring ring-bw8"/>
  <circle cx="200" cy="200" r="56" class="ring ring-610"/>
  <circle cx="200" cy="200" r="5" class="downtown"/>
  <text x="208" y="214" class="place-main">Downtown</text>
  {dots}
</svg>'''


def cta_band(p, heading, text):
    return f'''<section class="cta-band">
  <div class="wrap cta-inner">
    <div>
      <h2>{e(heading)}</h2>
      <p>{e(text)}</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-brass" href="{p}index.html#contact">Book a walkthrough</a>
      <a class="btn btn-ghost" href="tel:{PHONE_TEL}">Call {PHONE}</a>
    </div>
  </div>
</section>'''


def page_hero(title, intro, aside=''):
    return f'''<section class="page-hero">
  <div class="wrap page-hero-inner{" has-aside" if aside else ""}">
    <div>
      <h1>{e(title)}</h1>
      <p class="lede">{e(intro)}</p>
    </div>
    {aside}
  </div>
</section>'''


# ---------------------------------------------------------------- pages

def service_page(s):
    path = f'services/{s["slug"]}.html'
    projects = [pr for pr in PROJECTS if pr['service'] == s['slug']]
    areas_here = [a for a in AREAS if s['slug'] in a['services']] or AREAS
    trail = [('Services', 'services/index.html'), (s['name'], path)]

    def body(p):
        includes = ''.join(f'<li>{e(x)}</li>' for x in s['includes'])
        notes = ''.join(f'<div><h3>{e(h)}</h3><p>{e(t)}</p></div>' for h, t in s['houston'])
        faqs = ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in s['faqs'])
        area_links = ''.join(
            f'<li><a href="{p}areas/{a["slug"]}.html">{e(s["name"])} in {e(a["name"])}</a></li>' for a in areas_here)
        other_areas = [a for a in AREAS if a not in areas_here]
        also = ''
        if other_areas:
            also = '<p class="also">We also work in ' + ', '.join(
                f'<a href="{p}areas/{a["slug"]}.html">{e(a["name"])}</a>' for a in other_areas) + ' and across Greater Houston.</p>'
        aside = ''
        if projects:
            pr = projects[0]
            after = next(ph for ph in pr['photos'] if ph[1] == 'After')
            aside = f'<a class="hero-photo" href="{p}projects/{pr["slug"]}.html">{img(p, after[0], after[2], "", "(max-width: 900px) 100vw, 40vw", eager=True)}<span>{e(pr["title"])}</span></a>'
        proj = ''
        if projects:
            proj = f'''<section class="section">
  <div class="wrap">
    <h2 class="section-title">{e(s["name"])} projects</h2>
    {project_grid(p, projects)}
  </div>
</section>'''
        return f'''{crumbs(p, trail)}
{page_hero(s["title"], s["intro"], aside)}
<section class="section">
  <div class="wrap split">
    <div>
      <h2 class="section-title">What’s included</h2>
      <ul class="check-list">{includes}</ul>
    </div>
    <div>
      <h2 class="section-title">How long it takes</h2>
      <p>{e(s["timeline"])}</p>
    </div>
  </div>
</section>
<section class="section section-oak">
  <div class="wrap">
    <h2 class="section-title">Built for Houston houses</h2>
    <div class="notes">{notes}</div>
  </div>
</section>
{proj}
<section class="section">
  <div class="wrap split">
    <div>
      <h2 class="section-title">Where we do this</h2>
      <ul class="link-list">{area_links}</ul>
      {also}
    </div>
    <div>
      <h2 class="section-title">Questions</h2>
      <div class="faqs">{faqs}</div>
    </div>
  </div>
</section>
{cta_band(p, f"Planning {s['name'].lower()}?", "We’ll walk the house with you, talk through what you want and give you a line-item estimate.")}'''

    faq_ld = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in s['faqs']],
    }
    service_ld = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'serviceType': s['name'],
        'provider': {'@type': 'HomeAndConstructionBusiness', 'name': BRAND, 'url': SITE_URL + '/'},
        'areaServed': [{'@type': 'Place', 'name': f'{a["name"]}, TX'} for a in AREAS],
        'description': s['summary'],
    }
    return page(path, f'{s["title"]} | Kayman Constructions', s['summary'], body,
                jsonld=(service_ld, faq_ld, crumbs_ld(trail)))


def area_page(a):
    path = f'areas/{a["slug"]}.html'
    projects = [pr for pr in PROJECTS if pr['area'] == a['slug']]
    trail = [('Service area', 'areas/index.html'), (a['name'], path)]
    title = f'Remodeling and Renovation in {a["name"]}, TX'

    def body(p):
        services = ''.join(
            f'<li><a href="{p}services/{sl}.html"><strong>{e(SERVICE[sl]["name"])} in {e(a["name"])}</strong>'
            f'<span>{e(SERVICE[sl]["summary"])}</span></a></li>' for sl in a['services'])
        nearby = ', '.join(f'<a href="{p}areas/{sl}.html">{e(AREA[sl]["name"])}</a>' for sl in a['nearby'])
        proj = ''
        if projects:
            proj = f'''<section class="section">
  <div class="wrap">
    <h2 class="section-title">Projects in {e(a["name"])}</h2>
    {project_grid(p, projects)}
  </div>
</section>'''
        return f'''{crumbs(p, trail)}
{page_hero(title, a["intro"], f'<figure class="hero-map">{mini_map(a["slug"])}<figcaption>{e(a["county"])}</figcaption></figure>')}
<section class="section">
  <div class="wrap area-facts">
    <div><h2>Homes in {e(a["name"])}</h2><p>{e(a["homes"])}</p></div>
    <div><h2>Permits and approvals</h2><p>{e(a["permits"])}</p></div>
    <div><h2>Soil, trees and flooding</h2><p>{e(a["ground"])}</p></div>
  </div>
</section>
<section class="section section-paper">
  <div class="wrap">
    <h2 class="section-title">What we build in {e(a["name"])}</h2>
    <ul class="service-links">{services}</ul>
    <p class="also">See <a href="{p}services/index.html">all services</a>. Nearby, we also work in {nearby}.</p>
  </div>
</section>
{proj}
{cta_band(p, f"Remodeling in {a['name']}?", "We’ll come out, walk the house with you and handle the permits and approvals for your city and HOA.")}'''

    local_ld = dict(business_jsonld(), areaServed={'@type': 'Place', 'name': f'{a["name"]}, TX'})
    return page(path, f'{title} | Kayman Constructions', f'{a["intro"]} Kitchens, baths, additions and whole-home renovations in {a["name"]}.',
                body, jsonld=(local_ld, crumbs_ld(trail)))


def project_page(pr):
    path = f'projects/{pr["slug"]}.html'
    s, a = SERVICE[pr['service']], AREA[pr['area']]
    trail = [('Projects', 'projects/index.html'), (pr['title'], path)]
    others = [x for x in PROJECTS if x is not pr][:3]

    def body(p):
        story = ''.join(
            f'<div class="story-result"><h2>{e(h)}</h2><p>{e(t)}</p></div>' if h == 'The result'
            else f'<h2>{e(h)}</h2><p>{e(t)}</p>' for h, t in pr['story'])
        scope = ''.join(f'<li>{e(x)}</li>' for x in pr['scope'])
        steps = ''
        if any(ph[1] == 'During' for ph in pr['photos']) or len(pr['photos']) > 2:
            figs = ''.join(
                f'<figure>{img(p, n, alt, "", "(max-width: 800px) 100vw, 33vw")}<figcaption>{e(label)}</figcaption></figure>'
                for n, label, alt in pr['photos'])
            steps = f'<section class="section"><div class="wrap"><h2 class="section-title">Start to finish</h2><div class="steps-photos">{figs}</div></div></section>'
        return f'''{crumbs(p, trail)}
<section class="page-hero project-hero">
  <div class="wrap">
    <h1>{e(pr["title"])}</h1>
    <p class="lede">{e(pr["summary"])}</p>
    {sample_note(pr)}
  </div>
</section>
<section class="section section-tight">
  <div class="wrap">{ba_slider(p, pr)}</div>
</section>
<section class="section">
  <div class="wrap project-body">
    <article class="story">{story}</article>
    <aside class="facts">
      <dl>
        <div><dt>Service</dt><dd><a href="{p}services/{s["slug"]}.html">{e(s["name"])}</a></dd></div>
        <div><dt>Location</dt><dd><a href="{p}areas/{a["slug"]}.html">{e(a["name"])}</a></dd></div>
        <div><dt>The house</dt><dd>{e(pr["house"])}</dd></div>
        <div><dt>Construction time</dt><dd>{e(pr["duration"])}</dd></div>
      </dl>
      <h2>Scope</h2>
      <ul class="check-list">{scope}</ul>
    </aside>
  </div>
</section>
{steps}
{cta_band(p, f"Planning {s['name'].lower()} in {a['name']}?", "Tell us about your house. We’ll come out, take measurements and give you a line-item estimate.")}
<section class="section">
  <div class="wrap">
    <h2 class="section-title">More projects</h2>
    {project_grid(p, others)}
  </div>
</section>'''

    return page(path, f'{pr["title"]} | Kayman Constructions', pr['summary'], body,
                noindex=pr['sample'], jsonld=(crumbs_ld(trail),))


def services_index():
    path = 'services/index.html'
    trail = [('Services', path)]

    def body(p):
        groups = ''
        for g, text in GROUPS.items():
            items = ''.join(
                f'<li><a href="{p}services/{s["slug"]}.html"><strong>{e(s["name"])}</strong><span>{e(s["summary"])}</span></a></li>'
                for s in SERVICES if s['group'] == g)
            groups += f'<div class="service"><h2>{e(g)}</h2><div class="service-body"><p>{e(text)}</p><ul class="service-links">{items}</ul></div></div>'
        return f'''{crumbs(p, trail)}
{page_hero("Remodeling, renovation and new homes in Houston", "Everything we build, from a single bathroom to a new house. Pick a service to see what’s included, how long it takes and projects we’ve done.")}
<section class="section services"><div class="wrap">{groups}</div></section>
{cta_band(p, "Not sure what you need?", "Most projects are a mix. Book a walkthrough and we’ll help you sort out the scope.")}'''

    return page(path, 'Services | Kayman Constructions', 'Kitchen and bathroom remodeling, whole-home renovation, additions, outdoor living and custom homes across Greater Houston.',
                body, jsonld=(business_jsonld(), crumbs_ld(trail)))


def areas_index():
    path = 'areas/index.html'
    trail = [('Service area', path)]

    def body(p):
        items = ''.join(
            f'<li><a href="{p}areas/{a["slug"]}.html"><strong>{e(a["name"])}</strong><span>{e(a["intro"])}</span></a></li>' for a in AREAS)
        return f'''{crumbs(p, trail)}
{page_hero("Where we work", "Greater Houston, from inside the 610 Loop out past the Grand Parkway. Each area has its own permits, HOAs and housing stock, and we plan around them.", f'<figure class="hero-map">{mini_map()}<figcaption>Not to scale.</figcaption></figure>')}
<section class="section"><div class="wrap"><ul class="service-links two-col">{items}</ul>
<p class="also">Don’t see your neighborhood? We work across Greater Houston, so ask anyway.</p></div></section>
{cta_band(p, "Book a walkthrough", "Tell us where the house is and what you want to change.")}'''

    return page(path, 'Service Area: Greater Houston | Kayman Constructions', 'Kayman Constructions works across Greater Houston, including The Heights, Katy, Sugar Land, The Woodlands, Pearland, Bellaire, Memorial and Kingwood.',
                body, jsonld=(business_jsonld(), crumbs_ld(trail)))


def projects_index():
    path = 'projects/index.html'
    trail = [('Projects', path)]
    sample = any(pr['sample'] for pr in PROJECTS)

    def body(p):
        note = ('<p class="sample-note">These are sample projects with stock photos. Replace them with real Kayman projects before launch.</p>'
                if sample else '')
        return f'''{crumbs(p, trail)}
{page_hero("Projects", "Kitchens, baths, additions and whole-home renovations across Greater Houston, with before and after photos.")}
<section class="section"><div class="wrap">{note}{project_grid(p, PROJECTS)}</div></section>
{cta_band(p, "Want results like these?", "Book a walkthrough and we’ll talk through your house.")}'''

    return page(path, 'Projects | Kayman Constructions', 'Before and after photos of kitchen, bathroom, addition and whole-home renovation projects across Greater Houston.',
                body, noindex=sample, jsonld=(crumbs_ld(trail),))


def about_page():
    path = 'about.html'
    trail = [('About us', path)]
    a = ABOUT

    def body(p):
        note = ('<p class="sample-note">Draft. The highlighted parts are placeholders for Kaif and Amaan’s own story. '
                'Fill them in, then remove the draft flag.</p>') if a['draft'] else ''
        story = ''.join(f'<h2>{e(h)}</h2><p>{todo(t)}</p>' for h, t in a['story'])
        promise = ''.join(f'<div><h3>{e(h)}.</h3><p>{e(t)}</p></div>' for h, t in a['promise'])
        contact = {c['name']: c for c in CONTACTS}
        partners = ''
        for pt in a['partners']:
            c = contact.get(pt['name'], {})
            reach = (f'<p class="partner-reach"><a href="tel:{c["tel"]}">{c["phone"]}</a><br>'
                     f'<a href="mailto:{c["email"]}">{c["email"]}</a></p>') if c else ''
            partners += f'''<article class="partner">
  <span class="partner-mono" aria-hidden="true">{e(pt["name"][0])}</span>
  <h3>{e(pt["name"])}</h3>
  <p class="partner-role">{e(pt["role"])}</p>
  <p>{todo(pt["bio"])}</p>
  {reach}
</article>'''
        return f'''{crumbs(p, trail)}
{page_hero(a["title"], a["intro"])}
<section class="section section-tight">
  <div class="wrap about-body">
    <article class="story">{note}{story}</article>
    <aside class="about-mark">{LOGO_MARK}<p>{e(TAGLINE)}</p></aside>
  </div>
</section>
<section class="section section-oak">
  <div class="wrap">
    <h2 class="section-title">What our name promises</h2>
    <div class="promise">{promise}</div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <h2 class="section-title">The partners</h2>
    <div class="partners">{partners}</div>
  </div>
</section>
{cta_band(p, "Talk to us about your house", "Book a walkthrough and one of us will come out to see it in person.")}'''

    return page(path, f'About Us | {BRAND}', a['intro'], body, noindex=a['draft'], jsonld=(business_jsonld(), crumbs_ld(trail)))


# ---------------------------------------------------------------- home page

def replace_block(html, name, content):
    pattern = re.compile(rf'(<!-- build:{name} -->).*?(<!-- /build:{name} -->)', re.S)
    if not pattern.search(html):
        raise SystemExit(f'index.html is missing the build:{name} markers')
    return pattern.sub(lambda m: f'{m[1]}\n{content}\n{m[2]}', html)


def update_home():
    path = ROOT / 'index.html'
    html = path.read_text()
    p = ''
    html = replace_block(html, 'header', header(p))
    html = replace_block(html, 'footer', footer(p))

    groups = ''
    for g, text in GROUPS.items():
        items = ''.join(f'<li><a href="services/{s["slug"]}.html">{e(s["name"])}</a></li>' for s in SERVICES if s['group'] == g)
        groups += f'''<div class="service">
        <h3>{e(g)}</h3>
        <div class="service-body">
          <p>{e(text)}</p>
          <ul>{items}</ul>
        </div>
      </div>'''
    html = replace_block(html, 'services', groups)

    hoods = ''.join(f'<li><a href="areas/{a["slug"]}.html">{e(a["name"])}</a></li>' for a in AREAS)
    extra = ['Montrose', 'River Oaks', 'West University', 'Cypress', 'Spring', 'Humble', 'Pasadena', 'Clear Lake', 'League City', 'Missouri City']
    hoods += ''.join(f'<li>{e(x)}</li>' for x in extra)
    html = replace_block(html, 'hoods', hoods)

    html = replace_block(html, 'projects', project_grid(p, PROJECTS))
    html = replace_block(html, 'jsonld', f'<script type="application/ld+json">{json.dumps(business_jsonld(), ensure_ascii=False)}</script>')
    path.write_text(html)


# ---------------------------------------------------------------- run

def main():
    pages = ['index.html']
    pages.append(services_index())
    pages += [service_page(s) for s in SERVICES]
    pages.append(areas_index())
    pages += [area_page(a) for a in AREAS]
    projects = [project_page(pr) for pr in PROJECTS]
    projects_idx = projects_index()
    about = about_page()
    update_home()

    indexable = pages + [pp for pp, pr in zip(projects, PROJECTS) if not pr['sample']]
    if not ABOUT['draft']:
        indexable.append(about)
    if not any(pr['sample'] for pr in PROJECTS):
        indexable.append(projects_idx)
    sitemap = ''.join(f'  <url><loc>{url(x)}</loc></url>\n' for x in indexable)
    (ROOT / 'sitemap.xml').write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{sitemap}</urlset>\n')
    (ROOT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n')
    print(f'Built {len(pages) + len(projects) + 2} pages; {len(indexable)} in sitemap.xml')


if __name__ == '__main__':
    main()
