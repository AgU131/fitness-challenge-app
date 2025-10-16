async function fetchFragment(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } catch (e) {
        return null;
    }
}

async function includeHeaderFooter() {
    // Try likely locations for header/footer relative to the current document
    const candidates = [
        '/header.html',
        '../header.html',
        './header.html',
        '/footer.html',
        '../footer.html',
        './footer.html'
    ];

    // Determine header/footer path by trying a few relative variants
    const headerPaths = ['header.html', '../header.html', './header.html', '/header.html'];
    const footerPaths = ['footer.html', '../footer.html', './footer.html', '/footer.html'];

    let headerHTML = null;
    for (const p of headerPaths) {
        headerHTML = await fetchFragment(p);
        if (headerHTML) { break; }
    }

    let footerHTML = null;
    for (const p of footerPaths) {
        footerHTML = await fetchFragment(p);
        if (footerHTML) { break; }
    }

    const headerPlaceholders = ['header-placeholder', 'site-header', 'site-header-placeholder'];
    const footerPlaceholders = ['footer-placeholder', 'site-footer', 'site-footer-placeholder'];

    for (const id of headerPlaceholders) {
        const el = document.getElementById(id);
        if (el && headerHTML) {
            el.innerHTML = headerHTML;
            break;
        }
    }

    for (const id of footerPlaceholders) {
        const el = document.getElementById(id);
        if (el && footerHTML) {
            el.innerHTML = footerHTML;
            break;
        }
    }
}

// Run on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', includeHeaderFooter);
} else {
    includeHeaderFooter();
}