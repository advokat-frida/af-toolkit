export function SiteHeader() {
  return (
    <header className="site-bar">
      <a className="bar-wordmark" href="https://advokatfrida.com/">Advokat Frida</a>
      <a className="chip-subscribe" href="https://advokatfrida.com/#/portal/signup">Subscribe</a>
      <nav className="bar-nav" aria-label="Sections">
        <ul>
          <li><a href="https://advokatfrida.com/tag/toolkit/">Toolkit</a></li>
          <li><a href="https://advokatfrida.com/tag/field-guides/">Field Guides</a></li>
          <li><a href="https://advokatfrida.com/tag/fridas-desk/">Frida&rsquo;s Desk</a></li>
          <li><a href="https://shop.advokatfrida.com">The Mercantile</a></li>
          <li><a href="https://advokatfrida.com/about/">About</a></li>
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-colophon">
      <div className="site-colophon-inner">
        <div className="site-colophon-brand">
          <p className="site-colophon-name">Advokat Frida</p>
          <p className="site-colophon-desc">Privacy and AI governance, by design and in practice.<br />Analytics by Plausible, cookieless and aggregate, no ad-tech.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="site-colophon-nav">
            <li><a href="https://advokatfrida.com/about/">About</a></li>
            <li><a href="mailto:hello@advokatfrida.com">Contact us</a></li>
            <li><a href="https://advokatfrida.com/privacy/">Privacy</a></li>
            <li><a href="https://advokatfrida.com/rss/">RSS</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
