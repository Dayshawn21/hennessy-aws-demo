import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  bookerChoices, campuses, navigation, pageMeta, photos, portfolio,
  reviews, services, sessionChoices, sessionOrder, site,
} from "./content.js";
import { submitInquiry } from "./formAdapter.js";
import AdminPage from "./admin.tsx";

const internalRoutes = new Set(["/", "/sessions", "/business", "/work", "/about", "/contact", "/admin"]);
const legacyRoutes = { "/portfolio": "/work", "/services": "/sessions", "/studio": "/business", "/graduation": "/sessions" };
const legacyHash = { "/graduation": "#graduation" };

function normalizePath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (legacyRoutes[path]) return legacyRoutes[path];
  return internalRoutes.has(path) ? path : "/404";
}

function useRoute() {
  const [path, setPath] = useState(() => {
    const initial = normalizePath(window.location.pathname);
    const raw = window.location.pathname.replace(/\/+$/, "") || "/";
    if (legacyRoutes[raw]) window.history.replaceState({}, "", initial + window.location.search + (legacyHash[raw] || window.location.hash));
    return initial;
  });
  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const navigate = (href) => {
    const url = new URL(href, window.location.origin);
    const next = normalizePath(url.pathname);
    if (url.pathname + url.search === window.location.pathname + window.location.search) {
      if (url.hash) {
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        document.querySelector(url.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.history.pushState({}, "", url.pathname + url.search + url.hash);
    setPath(next);
    if (url.hash) window.setTimeout(() => document.querySelector(url.hash)?.scrollIntoView({ behavior: "auto", block: "start" }), 0);
    else window.scrollTo({ top: 0, behavior: "auto" });
  };
  return [path, navigate];
}

function InternalLink({ href, navigate, className, children, onClick, ...props }) {
  return (
    <a href={href} className={className} onClick={(event) => {
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        navigate(href);
        onClick?.();
      }
    }} {...props}>{children}</a>
  );
}

/* ---------- Drawn marks: one stroke weight, chalk or ink ---------- */

function ArrowIcon() {
  return <svg className="icon-arrow" viewBox="0 0 20 12" aria-hidden="true"><path d="M1 6h17M13 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ExternalIcon() {
  return <svg className="icon-arrow" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2h8v8M12 2 2 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChalkTick() {
  return <svg className="chalk-tick" viewBox="0 0 24 20" aria-hidden="true"><path d="M2.5 11.5c2.2 1.6 3.8 3.6 5.2 6 3-6.4 7.6-11.6 13.8-15.6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ChalkUnderline() {
  return <svg className="chalk-underline" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true"><path d="M3 12c40-5 92-8 150-7.5 52 .4 98 2.6 144 6.4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>;
}

function Pin({ className = "" }) {
  return <svg className={`pin ${className}`} viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="currentColor" /></svg>;
}

/* ---------- Atelier components ---------- */

function Photo({ src, alt, position, ...props }) {
  const base = src.replace(/\.(png|jpg)$/, "");
  return <picture><source srcSet={`${base}.avif`} type="image/avif" /><source srcSet={`${base}.webp`} type="image/webp" /><img src={src} alt={alt} style={position ? { objectPosition: position } : undefined} {...props} /></picture>;
}

function PhotoFlag({ photo }) {
  if (photo.preview) return <span className="placeholder-flag">Low-res preview</span>;
  if (photo.placeholder) return <span className="placeholder-flag">Placeholder photo</span>;
  return null;
}

function PinnedPhoto({ photo, notes = [], className = "", eager = false }) {
  return (
    <figure className={`pinned ${className}`}>
      <div className="pinned__paper" aria-hidden="true"><span className="notch notch--a" /><span className="notch notch--b" /></div>
      <div className="pinned__frame">
        <Photo src={photo.src} alt={photo.alt} position={photo.position} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} />
        <Pin className="pin--left" /><Pin className="pin--right" />
        <PhotoFlag photo={photo} />
      </div>
      {notes.map((note) => <figcaption key={note.text} className={`chalk-note chalk-note--${note.at}`}>{note.text}</figcaption>)}
    </figure>
  );
}

function HangTag({ service, href, navigate, className = "", showSummary = false, as = "link", headingId }) {
  const body = (
    <>
      <span className="tag__eyelet" aria-hidden="true" />
      {/* On Sessions and Business the tag title is the section's heading. */}
      {headingId ? <h2 id={headingId} className="tag__title">{service.title}</h2> : <strong className="tag__title">{service.title}</strong>}
      <span className="tag__price">{service.price}</span>
      {service.chalk && <span className="tag__chalk">{service.chalk}</span>}
      {showSummary && <span className="tag__summary">{service.summary}</span>}
      {as === "link" && <span className="tag__more">See what’s included <ArrowIcon /></span>}
    </>
  );
  if (as === "static") return <div className={`tag ${className}`}>{body}</div>;
  return <InternalLink href={href} navigate={navigate} className={`tag ${className}`}>{body}</InternalLink>;
}

const bookingFor = (slug) => site.sessionBooking[slug] || site.bookingUrl;

function AppointmentCard({ label = "Book a session", detail = "Opens the booking calendar", stub = "From $145", size = "", href, navigate, session }) {
  const body = (
    <>
      <span className="appointment__main">
        <strong className="appointment__label">{label}</strong>
        <span className="appointment__detail">{detail} {href ? <ArrowIcon /> : <ExternalIcon />}{!href && <span className="visually-hidden"> (opens Pixieset in a new tab)</span>}</span>
      </span>
      {stub && <span className="appointment__stub">{stub}</span>}
    </>
  );
  const className = `appointment ${size ? `appointment--${size}` : ""}`;
  if (href) return <InternalLink className={className} href={href} navigate={navigate}>{body}</InternalLink>;
  return <a className={className} href={bookingFor(session)} target="_blank" rel="noreferrer">{body}</a>;
}

function GhostSlot({ title, body, chalk, className = "" }) {
  return (
    <div className={`ghost ${className}`}>
      {chalk && <span className="ghost__chalk" aria-hidden="true">{chalk}</span>}
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function PageHero({ title, lede, children, aside }) {
  return (
    <section className="page-hero page-hero--split">
      <div className="page-hero__copy">
        <h1 className="display">{title}</h1>
        <p className="lede">{lede}</p>
        {children}
      </div>
      {aside}
    </section>
  );
}

function TextLink({ href, navigate, children }) {
  return <InternalLink className="text-link" href={href} navigate={navigate}>{children} <ArrowIcon /></InternalLink>;
}

// A Work filter only appears once a category has two photos, so links to it follow the same rule.
const workCounts = portfolio.reduce((acc, item) => ({ ...acc, [item.category]: (acc[item.category] || 0) + 1 }), {});
const workCategories = ["All", ...Object.keys(workCounts).filter((category) => workCounts[category] >= 2)];

function WorkLink({ category, navigate }) {
  if (!workCategories.includes(category)) return null;
  return <TextLink href={`/work?filter=${encodeURIComponent(category)}`} navigate={navigate}>See more in {category}</TextLink>;
}

function ChoiceGroup({ label, name, options, value, onChange, className = "" }) {
  return (
    <fieldset className={`choice-group ${className}`}>
      <legend>{label}</legend>
      <div className="choice-group__options">
        {options.map((option) => (
          <label key={option.value} className={`choice ${value === option.value ? "is-chosen" : ""}`}>
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
            {value === option.value && <ChalkTick />}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------- Chrome ---------- */

function Wordmark({ navigate }) {
  return (
    <InternalLink href="/" navigate={navigate} className="wordmark" aria-label="Hennessy Williams Photo, home">
      <span className="wordmark__name">Hennessy Williams</span><span className="wordmark__trade">Photo</span>
    </InternalLink>
  );
}

function Header({ path, navigate }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    if (!open) return () => document.body.classList.remove("menu-open");
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("menu-open"); window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <header className="site-header">
      <Wordmark navigate={navigate} />
      <nav id="primary-nav" className={`primary-nav ${open ? "is-open" : ""}`} aria-label="Primary">
        {navigation.map((item) => <InternalLink key={item.href} href={item.href} navigate={navigate} aria-current={path === item.href ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</InternalLink>)}
        <InternalLink href="/contact" navigate={navigate} className="primary-nav__contact" aria-current={path === "/contact" ? "page" : undefined} onClick={() => setOpen(false)}>Contact</InternalLink>
        <a className="primary-nav__client" href={site.galleryUrl} target="_blank" rel="noreferrer">Client pages <ExternalIcon /><span className="visually-hidden"> (opens your Pixieset gallery in a new tab)</span></a>
      </nav>
      <div className="site-header__actions">
        <span className="header-place">Stockton · Sacramento</span>
        <a className="header-book" href={site.bookingUrl} target="_blank" rel="noreferrer">Book<span className="visually-hidden"> a session (opens Pixieset in a new tab)</span></a>
        <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Menu"}</button>
      </div>
    </header>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Wordmark navigate={navigate} />
          <p>Portraits fitted to the person. A 650 sq ft studio in Stockton, serving Sacramento.</p>
        </div>
        <nav aria-label="Footer">
          {navigation.map((item) => <InternalLink key={item.href} href={item.href} navigate={navigate}>{item.label}</InternalLink>)}
          <InternalLink href="/contact" navigate={navigate}>Contact</InternalLink>
          <a href={site.galleryUrl} target="_blank" rel="noreferrer">Client pages</a>
        </nav>
        <address>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phone}`}>{site.phoneDisplay}</a>
          <a href={site.instagram} target="_blank" rel="noreferrer">Instagram {site.instagramHandle}</a>
        </address>
      </div>
      <p className="site-footer__legal">© 2026 Hennessy Williams Photo · Booking and galleries by Pixieset · <InternalLink href="/admin" navigate={navigate}>Admin (demo)</InternalLink></p>
    </footer>
  );
}

function MobileBookBar({ path }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [path]);
  if (path === "/contact") return null;
  return (
    <div className={`book-bar ${show ? "is-shown" : ""}`} aria-hidden={!show}>
      <span>Sessions from $145</span>
      <a href={site.bookingUrl} target="_blank" rel="noreferrer" tabIndex={show ? 0 : -1}>Book a session <ExternalIcon /></a>
    </div>
  );
}

/* ---------- Motion: copy rises, photos unveil, tags drop and settle ---------- */

const revealKinds = [
  ["photo", ".pinned__frame, .rail__photo, .session__strip figure, .work-tile"],
  ["tag", ".tag"],
  ["rise", [
    ".hero__copy > *", ".page-hero__copy > *", ".hero__actions", ".section-head > *", ".rail__label",
    ".studio-feature__copy > *", ".origin__copy > *", ".ghost--photo", ".process > h2", ".process__steps > li",
    ".reviews > h2", ".reviews__list > *", ".closing > *", ".session__lede", ".session__copy > :not(.tag)",
    ".concept__copy > *", ".grad-slots > *", ".story > p", ".approach > h2", ".approach dl > div",
    ".work .choice-group", ".inquiry > :not(.hp-field)", ".contact__aside > *",
  ].join(", ")],
];
const revealEnd = { photo: "unveil", tag: "swing", rise: "rise" };

// Runs before paint so nothing flashes visible and then hides. Each element drops its
// reveal classes once its animation ends, which hands hover motion back to the stylesheet.
function useReveal(path) {
  useLayoutEffect(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const main = document.querySelector("main");
    const found = new Map();
    revealKinds.forEach(([kind, selector]) => main.querySelectorAll(selector).forEach((el) => !found.has(el) && found.set(el, kind)));
    // An element inside another revealed element already moves with it, and one never laid out never scrolls into view.
    const targets = [...found.keys()].filter((el) => el.getClientRects().length && ![...found.keys()].some((other) => other !== el && other.contains(el)));

    const finish = (event) => {
      const el = event.currentTarget;
      if (event.target !== el || event.animationName !== revealEnd[el.dataset.reveal]) return;
      el.classList.remove("reveal", "is-in");
      el.removeAttribute("data-reveal");
      el.style.removeProperty("--reveal-delay");
      el.removeEventListener("animationend", finish);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
        entry.target.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 90}ms`);
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });

    targets.forEach((el) => {
      el.dataset.reveal = found.get(el);
      el.classList.add("reveal");
      el.addEventListener("animationend", finish);
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
      targets.forEach((el) => {
        el.removeEventListener("animationend", finish);
        el.classList.remove("reveal", "is-in");
        el.removeAttribute("data-reveal");
      });
    };
  }, [path]);
}

/* ---------- Home ---------- */

function HomePage({ navigate }) {
  // Two rails of three. `span` is the desktop column width; `drop` sets how far the item hangs below the rod.
  const session = (slug, label, span, drop) => ({ service: { title: services[slug].title, price: services[slug].price }, href: `/sessions#${slug}`, photo: services[slug].photo, label, span, drop });
  const rails = [
    [
      session("graduation", "Cap and gown, campus or studio", 4, "lg"),
      session("portraits", "Individuals and couples", 4, "md"),
      session("families", "Up to five people included", 4, "sm"),
    ],
    [
      session("celebrations", "Birthdays, proposals, maternity, milestones", 4, "sm"),
      session("weddings", "Engagements, elopements and weddings", 4, "lg"),
      { service: { title: "Business", price: "From $25" }, href: "/business", photo: photos.productPerfume, label: "Product, real estate and studio rental", span: 4, drop: "md" },
    ],
  ];
  return (
    <main>
      <section className="hero">
        <div className="hero__copy">
          <h1 className="display">Fitted <span className="chalked">to you.<ChalkUnderline /></span></h1>
          <p className="lede">Portraits, families and graduation sessions from $145, directed around your idea in a 650 sq ft Stockton studio. Serving Sacramento too.</p>
        </div>
        <div className="hero__board">
          <PinnedPhoto photo={photos.womanChair} eager notes={[{ text: "1 look · 3 finished edits", at: "bottom" }, { text: "your concept", at: "side" }]} />
          <HangTag service={{ title: "Sessions", price: "From $145" }} href="/sessions" navigate={navigate} className="hero__tag" />
        </div>
        <div className="hero__actions">
          <AppointmentCard />
          <TextLink href="/work" navigate={navigate}>See the work</TextLink>
        </div>
      </section>

      <section className="rail-section" aria-labelledby="rail-heading">
        <div className="section-head">
          <h2 id="rail-heading">Find your session.</h2>
          <p>Every price is right on the tag.</p>
        </div>
        {rails.map((rail, railIndex) => (
          <div key={railIndex} className="rail">
            <span className="rail__rod" aria-hidden="true" />
            {rail.map((item) => (
              <article key={item.href} className={`rail__item rail__item--${item.drop}`} style={{ "--span": item.span }}>
                <span className="rail__hook" aria-hidden="true" />
                <InternalLink href={item.href} navigate={navigate} className="rail__photo" tabIndex={-1} aria-hidden="true"><Photo src={item.photo.src} alt="" position={item.photo.position} loading="lazy" /><PhotoFlag photo={item.photo} /></InternalLink>
                <HangTag service={item.service} href={item.href} navigate={navigate} />
                <p className="rail__label">{item.label}</p>
              </article>
            ))}
          </div>
        ))}
      </section>

      <section className="studio-feature" aria-labelledby="studio-heading">
        <PinnedPhoto photo={photos.manCanvas} className="studio-feature__photo" notes={[{ text: "650 sq ft", at: "top" }, { text: "12-ft roll-up door", at: "side" }, { text: "makeup station · lights · backdrops", at: "bottom" }]} />
        <div className="studio-feature__copy">
          <h2 id="studio-heading">One room, built for portraits.</h2>
          <p>Every studio session happens in Hennessy’s own space: backdrops ready, lights set, a makeup station, and no waiting on the weather. It is also yours to rent by the hour.</p>
          <TextLink href="/business" navigate={navigate}>Rent the studio</TextLink>
        </div>
      </section>

      <section className="origin" aria-labelledby="origin-heading">
        <div className="origin__copy">
          <h2 id="origin-heading">From one print on the South Side to a studio in Stockton.</h2>
          <p>Hennessy fell for photography watching an older brother develop a black-and-white portrait in Chicago. Every session since has chased the same thing: a picture that holds a whole story.</p>
          <TextLink href="/about" navigate={navigate}>Meet Hennessy</TextLink>
        </div>
        <PinnedPhoto className="origin__photo" photo={photos.originFilmPrints} />
      </section>

      <section className="process" aria-labelledby="process-heading">
        <h2 id="process-heading">How booking works</h2>
        <ol className="process__steps">
          <li><strong>Pick your tag</strong><p>Graduation, portraits, family, business. Every price is published.</p></li>
          <li><strong>Book a time</strong><p>The booking calendar shows live availability and takes payment.</p></li>
          <li><strong>Plan your look</strong><p>Bring an idea, an outfit, a prop. Hennessy shapes the session around it.</p></li>
          <li><strong>Get your gallery</strong><p>Finished edits arrive in a private online gallery to download and share.</p></li>
        </ol>
      </section>

      <Reviews />

      <section className="closing">
        <h2>Your session is one tap away.</h2>
        <AppointmentCard size="lg" />
        <TextLink href="/contact" navigate={navigate}>Or ask a question first</TextLink>
      </section>
    </main>
  );
}

function Reviews() {
  return (
    <section className="reviews" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">In clients’ words</h2>
      {reviews.length > 0 ? (
        <div className="reviews__list">{reviews.map((review) => <blockquote key={review.name}><p>{review.quote}</p><footer>{review.name} · {review.session}</footer></blockquote>)}</div>
      ) : (
        <div className="reviews__list">
          {[1, 2, 3].map((slot) => <GhostSlot key={slot} chalk="real review goes here" title={`Review ${slot}`} body="Reserved for a real client’s words, with their first name and session type." />)}
        </div>
      )}
    </section>
  );
}

/* ---------- Graduation ---------- */

const graduationCopy = {
  lede: "Your degree, your look, your idea. Shoot on campus or in the studio and leave with portraits you’ll actually want to post.",
  bringTitle: "What to bring",
  bring: ["Cap, gown, stole and cords", "An outfit you feel great in", "A prop that tells your story: a book, a jersey, an instrument"],
};

function GraduationSection({ navigate }) {
  const copy = graduationCopy;
  const contactHref = "/contact?session=graduation";
  return (
    <>
      <section className="session" id="graduation" aria-labelledby="graduation-heading">
        <PinnedPhoto photo={photos.gradReading} notes={[{ text: "campus or studio", at: "side" }]} />
        <div className="session__copy">
          <p className="session__lede">{copy.lede}</p>
          <HangTag service={services.graduation} as="static" showSummary headingId="graduation-heading" />
          <ul className="stitch-list">{services.graduation.includes.map((item) => <li key={item}>{item}</li>)}</ul>
          <div className="session__actions">
            <AppointmentCard label="Book graduation" stub={services.graduation.price} size="sm" session="graduation" detail="Opens the graduation calendar" />
            <TextLink href={contactHref} navigate={navigate}>Ask a question first</TextLink>
            <WorkLink category={services.graduation.title} navigate={navigate} />
          </div>
        </div>
      </section>

      <section className="concept concept--grad" aria-labelledby="concept-heading">
        <PinnedPhoto photo={photos.gradLibrary} notes={[{ text: "your idea here", at: "top" }]} />
        <div className="concept__copy">
          <h3 id="concept-heading" className="concept__title">Bring the idea. Hennessy builds the shot.</h3>
          <p>A past graduate sat in the stacks while hands reached out of the shelves holding books. Another posed on a split yellow and magenta backdrop. Tell Hennessy what four years meant to you and the session gets built around it.</p>
          <div className="bring">
            <h3>{copy.bringTitle}</h3>
            <ul className="stitch-list">{copy.bring.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="grad-slots" aria-label="Graduation details coming soon">
        {campuses.length > 0
          ? <div className="campuses-list"><h3>Campuses</h3><ul className="campus-list">{campuses.map((campus) => <li key={campus}>{campus}</li>)}</ul></div>
          : <GhostSlot chalk="list coming" title="Campuses Hennessy has photographed" body="This list fills in once Hennessy confirms the schools. Ask about yours when you book." />}
        <GhostSlot chalk="if Hennessy adds one" title="A concept session tier" body="Room for a longer, prop-driven graduation package." />
      </section>
    </>
  );
}

/* ---------- Sessions ---------- */

function SessionsPage({ navigate }) {
  useEffect(() => {
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" });
  }, []);
  return (
    <main>
      <PageHero
        title={<>Sessions for every <span className="chalked">chapter.<ChalkUnderline /></span></>}
        lede="Graduation, portraits, families, celebrations and weddings. Every session is directed, every price is on the tag."
        aside={<PinnedPhoto photo={photos.gradSeniorHeart} eager notes={[{ text: "from $145", at: "side" }]} />}
      />
      <div className="session-list">
        <GraduationSection navigate={navigate} />
        {sessionOrder.map((slug, index) => {
          const service = services[slug];
          return (
            <section key={slug} id={slug} className={`session ${index % 2 ? "" : "session--flip"}`} aria-labelledby={`${slug}-heading`}>
              <PinnedPhoto photo={service.photo} />
              <div className="session__copy">
                <HangTag service={service} as="static" showSummary headingId={`${slug}-heading`} />
                <ul className="stitch-list">{service.includes.map((item) => <li key={item}>{item}</li>)}</ul>
                {service.goodToKnow && (
                  <div className="good-to-know">
                    <h3>Good to know</h3>
                    <ul className="stitch-list">{service.goodToKnow.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
                {service.note && <p className="session__note">{service.note}</p>}
                <div className="session__actions">
                  <AppointmentCard label={service.bookLabel || `Book ${service.title.toLowerCase()}`} stub={service.price} size="sm" session={slug} detail={service.bookDetail || (site.sessionBooking[slug] ? `Opens the ${service.title.toLowerCase()} calendar` : "Opens the booking calendar")} />
                  <TextLink href={`/contact?session=${slug}`} navigate={navigate}>Ask about {service.title.toLowerCase()}</TextLink>
                  <WorkLink category={service.title} navigate={navigate} />
                </div>
              </div>
              {service.gallery && (
                <div className={`session__strip session__strip--${service.gallery.length}`}>
                  {service.gallery.map((key) => <figure key={key}><Photo src={photos[key].src} alt={photos[key].alt} position={photos[key].position} loading="lazy" /></figure>)}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <section className="closing">
        <h2>Not sure which session fits?</h2>
        <AppointmentCard size="lg" />
        <TextLink href="/contact" navigate={navigate}>Ask Hennessy first</TextLink>
      </section>
    </main>
  );
}

/* ---------- Business ---------- */

function BusinessPage({ navigate }) {
  const rental = services.studio;
  const product = services.product;
  const realEstate = services.realEstate;
  return (
    <main>
      <PageHero
        title={<>Photography for <span className="chalked">business.<ChalkUnderline /></span></>}
        lede="Product photos at $25 per item, real estate listings at $175, and Hennessy’s 650 sq ft Stockton studio by the hour."
        aside={<PinnedPhoto photo={photos.businessHero} eager />}
      />

      <section id="product" className="session" aria-labelledby="product-heading">
        <PinnedPhoto photo={product.photo} notes={[{ text: "per item", at: "side" }]} />
        <div className="session__copy">
          <HangTag service={product} as="static" showSummary headingId="product-heading" />
          <ul className="stitch-list">{product.includes.map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="session__note">Selling candles, cosmetics, clothing or baked goods? Tell Hennessy how many items you have and where the photos will be used.</p>
          <div className="session__actions">
            <AppointmentCard label="Book product photos" detail="Opens the product calendar" stub="$25 / item" size="sm" session="product" />
            <TextLink href="/contact?session=product&who=business" navigate={navigate}>Ask about product photos</TextLink>
          </div>
        </div>
      </section>

      <section id="realestate" className="session session--flip" aria-labelledby="realestate-heading">
        <PinnedPhoto photo={photos.realEstateInterior} />
        <div className="session__copy">
          <HangTag service={realEstate} as="static" showSummary headingId="realestate-heading" />
          <ul className="stitch-list">{realEstate.includes.map((item) => <li key={item}>{item}</li>)}</ul>
          <div className="session__actions">
            <AppointmentCard label="Book real estate photos" detail="Opens the real estate calendar" stub="$175" size="sm" session="realEstate" />
            <TextLink href="/contact?session=realEstate&who=business" navigate={navigate}>Ask about a listing</TextLink>
          </div>
        </div>
      </section>

      <section id="rental" className="session" aria-labelledby="rental-heading">
        <PinnedPhoto photo={rental.photo} notes={[{ text: "650 sq ft", at: "top" }, { text: "12-ft roll-up door", at: "side" }]} />
        <div className="session__copy">
          <HangTag service={rental} as="static" showSummary headingId="rental-heading" />
          <ul className="stitch-list">{rental.includes.map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="session__note">{rental.note} The roll-up door makes load-in easy for sets, furniture and gear.</p>
          <div className="session__actions">
            <AppointmentCard label="Book studio time" stub="$50 / hour" size="sm" session="studio" detail="Opens the studio rental calendar" />
            <TextLink href="/contact?session=studio" navigate={navigate}>Ask about a rental</TextLink>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Work ---------- */

// Row patterns on a 12-column grid. Every row sums to 12, so no row ever leaves a hole.
function layoutRows(items) {
  const patterns = [[7, 5], [5, 7], [4, 4, 4]];
  const spans = [];
  let index = 0;
  let pattern = 0;
  while (index < items.length) {
    const left = items.length - index;
    let row = patterns[pattern % patterns.length];
    if (left < row.length) row = left === 1 ? [12] : [6, 6];
    row.forEach((span) => spans.push(span));
    index += row.length;
    pattern += 1;
  }
  return spans;
}

function WorkPage() {
  const categories = workCategories;
  const [filter, setFilter] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("filter")?.toLowerCase();
    return categories.find((category) => category.toLowerCase() === requested) || "All";
  });
  const chooseFilter = (value) => {
    setFilter(value);
    window.history.replaceState({}, "", value === "All" ? "/work" : `/work?filter=${encodeURIComponent(value)}`);
  };
  const [activeIndex, setActiveIndex] = useState(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const visible = filter === "All" ? portfolio : portfolio.filter((item) => item.category === filter);
  const spans = layoutRows(visible);
  const active = activeIndex === null ? null : visible[activeIndex];

  const close = () => {
    setActiveIndex(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const step = (delta) => setActiveIndex((current) => (current + delta + visible.length) % visible.length);

  useEffect(() => {
    if (activeIndex === null) return undefined;
    dialogRef.current?.querySelector("[data-autofocus]")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "Tab") {
        const focusable = [...dialogRef.current.querySelectorAll("button")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("menu-open");
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("menu-open"); };
  }, [activeIndex, visible.length]);

  return (
    <main>
      <PageHero
        title={<>The <span className="chalked">work.<ChalkUnderline /></span></>}
        lede="Graduates, portraits, families and couples. Tap any photo to see it large."
        aside={<PinnedPhoto photo={photos.weddingRooftop} eager />}
      />
      <section className="work" aria-label="Portfolio">
        <ChoiceGroup label="Show" name="work-filter" className="choice-group--inline" value={filter} onChange={chooseFilter} options={categories.map((category) => ({ value: category, label: category }))} />
        <div className="work-grid">
          {visible.map((photo, index) => (
            <button key={photo.id} type="button" className="work-tile" style={{ "--span": spans[index] }} onClick={(event) => { triggerRef.current = event.currentTarget; setActiveIndex(index); }}>
              <Photo src={photo.src} alt={photo.alt} position={photo.position} loading={index > 1 ? "lazy" : "eager"} />
              <span className="work-tile__credit"><b>{photo.category}</b> / {photo.place}</span>
              <PhotoFlag photo={photo} />
            </button>
          ))}
        </div>
      </section>
      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${active.category} photo ${activeIndex + 1} of ${visible.length}`} ref={dialogRef} onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <figure>
            <Photo src={active.src} alt={active.alt} />
            <figcaption><span><b>{active.category}</b> / {active.place}</span><span className="lightbox__count">{activeIndex + 1} / {visible.length}</span></figcaption>
          </figure>
          <div className="lightbox__controls">
            <button type="button" onClick={() => step(-1)}>Previous</button>
            <button type="button" onClick={() => step(1)}>Next</button>
            <button type="button" onClick={close} data-autofocus>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- About ---------- */

function AboutPage({ navigate }) {
  return (
    <main>
      <section className="page-hero page-hero--split">
        <div className="page-hero__copy">
          <h1 className="display">Photography started with <span className="chalked">one print.<ChalkUnderline /></span></h1>
          <p className="lede">Growing up on the South Side of Chicago, Hennessy Williams learned early that a photograph could carry more than a likeness. It could hold a whole story.</p>
        </div>
        <PinnedPhoto photo={photos.originFilmPrints} eager />
      </section>
      <section className="story">
        <p>Watching his eldest brother develop a black-and-white film portrait turned curiosity into a lasting devotion to the craft.</p>
        <p>Today Hennessy photographs graduates, families, couples and anyone ready to mark a chapter, from a 650 sq ft studio in Stockton and on location across Sacramento. Every session is directed, relaxed, and built around making the person in front of the camera feel seen.</p>
      </section>
      <section className="approach" aria-labelledby="approach-heading">
        <h2 id="approach-heading">How a session feels</h2>
        <dl>
          <div><dt>Directed, not stiff</dt><dd>Clear posing and calm direction that builds confidence without erasing personality.</dd></div>
          <div><dt>Built on your idea</dt><dd>Props, color, wardrobe and backdrop chosen to tell your story, not a stock pose.</dd></div>
          <div><dt>Priced in the open</dt><dd>Sessions start at $145 and every package lists exactly what’s included.</dd></div>
        </dl>
      </section>
      <section className="closing">
        <h2>Ready when you are.</h2>
        <AppointmentCard size="lg" />
        <TextLink href="/contact" navigate={navigate}>Send a question</TextLink>
      </section>
    </main>
  );
}

/* ---------- Contact ---------- */

const initialForm = { booker: "self", name: "", email: "", phone: "", sessionType: "", preferredDate: "", message: "", company: "" };

function readPrefill() {
  const params = new URLSearchParams(window.location.search);
  const session = params.get("session");
  const who = params.get("who");
  return {
    ...initialForm,
    sessionType: sessionChoices.some((choice) => choice.value === session) ? session : "",
    booker: bookerChoices.some((choice) => choice.value === who) ? who : "self",
  };
}

function ContactPage() {
  const [values, setValues] = useState(readPrefill);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const today = new Date().toISOString().slice(0, 10);
  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Enter your name so Hennessy knows who to reply to.";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = "Enter an email address like name@example.com.";
    if (!values.sessionType) next.sessionType = "Choose the kind of session you’re asking about.";
    if (values.preferredDate && values.preferredDate < today) next.preferredDate = "Choose today or a future date.";
    if (values.message.trim().length < 12) next.message = "Add a sentence about what you’re planning (at least 12 characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const onChange = (event) => setField(event.target.name, event.target.value);
  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    try { await submitInquiry(values); setStatus("success"); setValues(initialForm); }
    catch { setStatus("error"); }
  };
  return (
    <main>
      <PageHero
        title={<>Tell Hennessy what you’re <span className="chalked">planning.<ChalkUnderline /></span></>}
        lede="Ready to book? The calendar is the fastest way. Have a question or a custom idea? Send it here."
        aside={<PinnedPhoto photo={photos.familyPlaid} eager notes={[{ text: "your idea here", at: "side" }]} />}
      />
      <section className="contact">
        <form className="inquiry" onSubmit={onSubmit} noValidate>
          <ChoiceGroup label="Who’s the session for?" name="booker" value={values.booker} onChange={(value) => setField("booker", value)} options={bookerChoices} />
          <label className="field"><span>Session type <b aria-hidden="true">*</b></span>
            <select name="sessionType" value={values.sessionType} onChange={onChange} required aria-invalid={Boolean(errors.sessionType)} aria-describedby={errors.sessionType ? "sessionType-error" : undefined}>
              <option value="">Choose one</option>
              {sessionChoices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
            </select>
            {errors.sessionType && <small id="sessionType-error" className="field__error">{errors.sessionType}</small>}
          </label>
          <div className="field-grid">
            <Field label="Your name" name="name" value={values.name} error={errors.name} onChange={onChange} required autoComplete="name" />
            <Field label="Email" name="email" type="email" value={values.email} error={errors.email} onChange={onChange} required autoComplete="email" />
            <Field label="Phone" name="phone" type="tel" value={values.phone} onChange={onChange} autoComplete="tel" hint="Optional" />
            <Field label="Preferred date" name="preferredDate" type="date" value={values.preferredDate} error={errors.preferredDate} onChange={onChange} min={today} hint="Optional" />
          </div>
          <Field label="What are you planning?" name="message" multiline value={values.message} error={errors.message} onChange={onChange} required hint="A sentence or two is plenty." />
          <label className="hp-field" aria-hidden="true">Company<input name="company" value={values.company} onChange={onChange} tabIndex="-1" autoComplete="off" /></label>
          <div className="inquiry__footer">
            <button className="button" type="submit" disabled={status === "loading"}>{status === "loading" ? "Sending…" : "Send inquiry"}</button>
            <p>Prototype mode: nothing is sent yet.</p>
          </div>
          <div className="form-status" aria-live="polite">
            {status === "success" && <p className="is-success"><ChalkTick /> Inquiry received (prototype only, nothing was sent).</p>}
            {status === "error" && <p className="is-error">That didn’t go through. Check your connection and send it again, or email {site.email}.</p>}
          </div>
        </form>
        <aside className="contact__aside" aria-label="Direct contact">
          <AppointmentCard label="See open times" stub="" />
          <h2>Direct</h2>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phone}`}>{site.phoneDisplay}</a>
          <a href={site.instagram} target="_blank" rel="noreferrer">Instagram {site.instagramHandle}</a>
          <p>Studio in the Stockton area. The address is on every booking in the calendar.</p>
        </aside>
      </section>
    </main>
  );
}

function Field({ label, name, type = "text", value, error, onChange, required = false, multiline = false, hint, ...rest }) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const props = { id: name, name, value, onChange, required, "aria-invalid": Boolean(error), "aria-describedby": describedBy, ...rest };
  return (
    <div className="field">
      <label htmlFor={name}>{label} {required && <b aria-hidden="true">*</b>}</label>
      {hint && <small id={hintId} className="field__hint">{hint}</small>}
      {multiline ? <textarea rows="5" {...props} /> : <input type={type} {...props} />}
      {error && <small id={errorId} className="field__error">{error}</small>}
    </div>
  );
}

/* ---------- 404 ---------- */

function NotFoundPage({ navigate }) {
  return (
    <main>
      <PageHero
        title={<>That page isn’t on the <span className="chalked">rack.<ChalkUnderline /></span></>}
        lede="The link may be old. Start from the home page or go straight to booking."
        aside={<PinnedPhoto photo={photos.kidsYellow} eager />}
      >
        <div className="hero__actions"><AppointmentCard /><TextLink href="/" navigate={navigate}>Back to home</TextLink></div>
      </PageHero>
    </main>
  );
}

function AppMeta({ path }) {
  useEffect(() => {
    const meta = pageMeta[path] || pageMeta["/"];
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://www.hennessywilliamsphoto.com${path === "/404" ? "/" : path}`);
  }, [path]);
  return null;
}

export function App() {
  const [path, navigate] = useRoute();
  useReveal(path);
  const page = useMemo(() => {
        if (path === "/sessions") return <SessionsPage navigate={navigate} />;
    if (path === "/business") return <BusinessPage navigate={navigate} />;
    if (path === "/work") return <WorkPage key={window.location.search} />;
    if (path === "/about") return <AboutPage navigate={navigate} />;
    if (path === "/contact") return <ContactPage key={window.location.search} />;
    if (path === "/admin") return <AdminPage />;
    if (path === "/404") return <NotFoundPage navigate={navigate} />;
    return <HomePage navigate={navigate} />;
  }, [path]);
  return (
    <>
      <AppMeta path={path} />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header path={path} navigate={navigate} />
      <div id="main-content">{page}</div>
      <Footer navigate={navigate} />
      <MobileBookBar path={path} />
    </>
  );
}
