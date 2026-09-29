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

// The publication colophon: one row, the Toolkit shell's footer verbatim
// (public/index.html + public/toolkit.css .toolkit-footer). No description line.
export function SiteFooter() {
  return (
    <footer className="site-colophon">
      <a className="site-colophon-brand" href="https://advokatfrida.com/">Advokat Frida</a>
      <nav aria-label="Footer">
        <a href="https://advokatfrida.com/about/">About</a>
        <a href="mailto:hello@advokatfrida.com">Contact</a>
        <a href="https://advokatfrida.com/privacy/">Privacy</a>
        <a href="https://advokatfrida.com/rss/">RSS</a>
      </nav>
    </footer>
  );
}
