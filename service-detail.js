'use strict';

(() => {
  const tr = window.BLVK_I18N?.t || (value => value);
  const services = {
    'texture-paint': {
      view: 'walls', title: 'Texture & Paint', kicker: 'Surface and atmosphere', image: 'assets/decorative-art.webp',
      lede: 'Layered finishes that give a wall depth, movement, and a character of its own.',
      overview: 'Layered paint, mineral textures, and hand-finished surfaces designed around the light and movement of a room.',
      best: 'Feature walls · Hospitality · Retail', lead: '1–3 weeks', positions: ['22% 50%', '50% 50%', '78% 50%']
    },
    'classic': {
      view: 'walls', title: 'Classic', kicker: 'Craft reinterpreted', image: 'assets/sculpture-collection.webp',
      lede: 'Ornamental detail and timeless visual language shaped for contemporary spaces.',
      overview: 'Ornamental compositions and timeless painted details interpreted for contemporary interiors.',
      best: 'Majlis · Villas · Statement ceilings', lead: '2–4 weeks', positions: ['20% 42%', '52% 44%', '82% 55%']
    },
    'murals': {
      view: 'walls', title: 'Murals', kicker: 'Art at architectural scale', image: 'assets/mural-visions.webp',
      lede: 'One-off painted environments developed around the story, scale, and rhythm of a place.',
      overview: 'Site-specific artwork developed to turn a complete wall into a visual focal point.',
      best: 'Homes · Restaurants · Public spaces', lead: '2–6 weeks', positions: ['18% 50%', '50% 45%', '82% 50%']
    },
    '3d-walls': {
      view: 'walls', title: '3D Walls', kicker: 'Form, shadow, and relief', image: 'assets/art-collection.webp',
      lede: 'Dimensional surfaces that change throughout the day as light travels across them.',
      overview: 'Sculptural relief and dimensional wall treatments that change character throughout the day.',
      best: 'Entrances · Lobbies · Feature rooms', lead: '3–6 weeks', positions: ['18% 45%', '52% 50%', '84% 42%']
    },
    'special-requests': {
      view: 'custom', title: 'Special Requests', kicker: 'An open creative brief', image: 'assets/services-moodboard.webp',
      lede: 'A flexible path for unusual objects, personal commissions, and ideas without a category.',
      overview: 'A flexible route for unusual objects, personal commissions, and ideas that do not fit a standard category.',
      best: 'Objects · Installations · Personal gifts', lead: 'Project dependent', positions: ['20% 48%', '50% 50%', '80% 48%']
    },
    'designing-services': {
      view: 'custom', title: 'Designing Services', kicker: 'Ideas made clear', image: 'assets/art-design.png',
      lede: 'Creative direction and visual systems developed from the first thought to a production-ready plan.',
      overview: 'Creative direction and visual development for spaces, artworks, products, and branded environments.',
      best: 'Concepts · Visual systems · Art direction', lead: '1–4 weeks', positions: ['18% 50%', '50% 50%', '82% 50%']
    },
    'decoration': {
      view: 'custom', title: 'Decoration', kicker: 'A complete point of view', image: 'assets/inspiration-customization.jpeg',
      lede: 'Artwork, objects, materials, and placement composed into one distinct spatial identity.',
      overview: 'A considered mix of artwork, objects, finishes, and placement to give a space a distinct identity.',
      best: 'Homes · Studios · Commercial spaces', lead: '1–3 weeks', positions: ['18% 50%', '50% 52%', '82% 50%']
    }
  };

  const params = new URLSearchParams(location.search);
  const key = services[params.get('type')] ? params.get('type') : 'texture-paint';
  const service = services[key];
  const language = window.BLVK_I18N?.language || 'en';
  const setText = (selector, value) => { const element = document.querySelector(selector); if (element) element.textContent = tr(value); };

  document.title = `${tr(service.title)} — Blvk Ink`;
  document.body.dataset.service = key;
  setText('[data-service-kicker]', service.kicker);
  setText('[data-service-title]', service.title);
  setText('[data-service-heading]', service.title);
  setText('[data-service-lede]', service.lede);
  setText('[data-service-overview]', service.overview);
  setText('[data-service-best]', service.best);
  setText('[data-service-lead]', service.lead);
  setText('[data-service-cta-copy]', 'Share the space, object, or idea and we will shape the right route with you.');

  const heroImage = document.querySelector('[data-service-image]');
  heroImage.src = service.image;
  heroImage.alt = tr(`${service.title} inspiration`);
  document.querySelectorAll('[data-service-visual]').forEach((image, index) => {
    image.src = service.image;
    image.alt = tr(`${service.title} detail ${index + 1}`);
    image.style.objectPosition = service.positions[index];
  });

  const back = document.querySelector('[data-service-back]');
  const backUrl = new URL('explore.html', location.href);
  backUrl.searchParams.set('view', service.view);
  if (language === 'ar') backUrl.searchParams.set('lang', 'ar');
  back.href = backUrl.href;

  document.querySelectorAll('[data-service-contact]').forEach(link => {
    const url = new URL('contact.html', location.href);
    url.searchParams.set('interest', key);
    if (language === 'ar') url.searchParams.set('lang', 'ar');
    link.href = url.href;
  });

  const steps = [
    ['Discovery', 'Tell us about the place, object, purpose, and references you are drawn to.'],
    ['Creative direction', 'We develop the visual route, materials, palette, and scale for approval.'],
    ['Refinement', 'The selected direction is adjusted and resolved before production begins.'],
    ['Production', 'We create, finish, and install or deliver the completed work.']
  ];
  const list = document.querySelector('[data-service-steps]');
  steps.forEach(([title, copy], index) => {
    const item = document.createElement('li');
    item.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><div><h3></h3><p></p></div>`;
    item.querySelector('h3').textContent = tr(title);
    item.querySelector('p').textContent = tr(copy);
    list.append(item);
  });
})();
