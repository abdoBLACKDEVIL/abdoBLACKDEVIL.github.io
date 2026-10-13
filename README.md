# Blvk Ink website

A standalone HTML, CSS, and JavaScript website. Open index.html locally or upload this folder to a static host.

## Pages

- index.html — short introduction, featured sample images, and the silver logo reveal.
- explore.html — one shared, URL-driven page for the Walls, Custom, Shop, and Gallery views.
- work.html — murals, decorative walls, and paintings with filters and image galleries.
- automotive.html — a separate automotive section, sample references, and photo slots.
- shop.html — six sample paintings, wall pieces, and sculptures; multi-view previews and an enquiry list.
- contact.html — selected pieces and a downloadable enquiry draft.

The studio inbox info@blvk.ink is not ready. The site does not submit orders, take payments, or send email. It clearly identifies the sample collection and lets visitors save a local enquiry draft. No personal details are stored by the site. Enquiry-list item IDs are saved in local storage when available.

The homepage starts with a four-slide hero: animated silver logo, Create your vision, Spaces that belong, and Shop. It advances every 3 seconds, with arrow controls, dots, keyboard navigation, touch swipes, and a pause button. Clicks and swipes restart the timer; keyboard navigation pauses playback until Play is selected. Hovering a CTA holds its slide while the visitor targets the button. Playback also pauses off-screen and in background tabs. Reduced-motion preferences disable automatic playback initially and bypass animation. The logo and artwork load locally; optional Google Fonts have system-font fallbacks.

The header uses `assets/blvkink-logo-transparent.png` as a horizontal wordmark. CSS crops the transparent margins and adapts its color for contrast; the supplied image is preserved intact. The animated hero keeps its silver emblem.

`hero-slider.js` and `hero-slider.css` control the homepage slider. The studio's Who we are, Mission, and Vision content follows it.

The four skateboard cards open `explore.html` with a `view` query parameter. `explore.js` switches the four views without reloading, maintains browser history, and controls the Shop and Gallery search, filters, and grid/list layouts. `explore.css` contains the shared-page layout.

### Hero artwork

Slides 2–4 use the supplied images in `assets/`: `blvkink-create-your-vision-3840x2160.png`, `blvkink-spaces-that-belong-3840x2160.png`, and `blvkink-shop-clean-3840x2160.png`. The `.hero-slide-art` element in each slide in `index.html` is the replacement point. Headings, body copy, buttons, counts, and controls are live HTML, translated into Arabic, and rearrange for mobile. The Spaces image stays centered to retain its light/dark division.

## Replacing the samples

See PHOTO-GUIDE.md for the exact photo checklist. catalog.js contains the sample names, categories, and image regions. Sample closer/detail views use crops of the same image; replace these with individual photographs when available.

The source images are supplied visual concepts, not verified completed projects. The original artwork files are preserved. Sample dimensions, prices, and stock have not been invented.

## English and Arabic

The header EN / AR links switch the current page while preserving its query parameters. The language is saved locally and carried in page links, including direct-file previews. `i18n.js` contains the Arabic translations; `script.js` uses the same translator for galleries, enquiries, and downloaded drafts. Arabic uses a mirrored layout and locally bundled Dubai Regular, Medium, and Bold fonts; see `assets/fonts/SOURCE.md` for their official download source.

Run `node tests/interactions.cjs`, `node tests/localization.cjs`, `node tests/hero-slider.cjs`, and `node tests/explore-page.cjs` to check both languages and the interactive pages.
