export default function Footer() {
  return (
    <footer className="af-colophon">
      <div className="af-colophon-inner">
        <div>
          <p className="af-colophon-name">Advokat Frida</p>
          <p className="af-colophon-desc">
            Privacy and AI governance, by design and in practice.<br />
            Analytics by Plausible, cookieless and aggregate, no ad-tech.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="af-colophon-nav">
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
