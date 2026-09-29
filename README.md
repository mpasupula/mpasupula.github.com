# mywebsite

Personal academic website of **Manideep Pasupula**, PhD researcher in wind-farm
aerodynamics and atmospheric boundary-layer flows at the University of Twente.

It is a plain static site (HTML, CSS and a little JavaScript), with no build step,
so it can be served directly by GitHub Pages or any static host.

## Structure

```
.
├── index.html            # the whole site: hero, about, research, publications, experience, contact
├── 404.html              # not-found page
├── assets/
│   ├── css/style.css     # styles, light and dark themes
│   ├── js/main.js        # menu, theme toggle, scroll effects, hero flow animation
│   └── img/
│       ├── portrait.jpg  # profile photo (640×640)
│       └── favicon.svg
└── .nojekyll             # tells GitHub Pages to serve files as-is
```

## Editing content

Everything lives in `index.html`, one `<section>` per part of the page.

- **Photo:** replace `assets/img/portrait.jpg` with another square image.
- **Publications:** copy an `<li class="pub">` block inside the right `<ol class="pubs">`.
- **CV:** put `cv.pdf` in `assets/` and uncomment the CV link in the Experience section.
- **Profiles:** add LinkedIn, ORCID, ResearchGate etc. as extra `<li>` items in the `.social` list.

Preview locally with any static server, for example:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Publishing on GitHub Pages

1. Go to **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
3. After a minute the site is live at `https://mpasupula.github.io/mywebsite/`.

## Moving to a custom domain

1. Buy a domain (for example `manideeppasupula.com`) from any registrar.
2. At the registrar, add DNS records:
   - For the apex domain, four `A` records pointing to
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - For `www`, a `CNAME` record pointing to `mpasupula.github.io`.
3. In **Settings → Pages → Custom domain**, enter the domain and save. GitHub adds a
   `CNAME` file to the repository.
4. Once the DNS check passes, tick **Enforce HTTPS**.

All links in the site are relative, so nothing else needs to change when the domain moves.
