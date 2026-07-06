/**
 * webflow-utils / links/obfuscate
 * Contrôle le maillage SEO en masquant des liens aux moteurs de recherche, et
 * protège emails/téléphones des harvesters — en gardant la destination hors du
 * HTML : l'URL réelle est stockée encodée en Base64 dans `wu-obfuscate` et n'est
 * décodée qu'au runtime, au moment de l'interaction.
 *
 * Le HTML publié ne contient donc aucun `href` exploitable — juste un élément
 * neutre (span, div, a sans href…) portant une chaîne Base64. Googlebot n'a
 * aucun lien à suivre (préserve link equity + crawl budget), et les harvesters
 * qui ne lisent que le source HTML (la grande majorité) ne récupèrent rien.
 *
 * Fonctionne pour :
 *  - liens classiques        wu-obfuscate="<base64 de https://...>"
 *  - emails                  wu-obfuscate-type="email" + base64 de l'adresse
 *  - téléphones              wu-obfuscate-type="tel"   + base64 du numéro
 *
 * Accessibilité / SEO : l'élément reçoit role="link", tabindex, et se pilote
 * clavier (Enter / Espace). Optionnellement, un vrai <a href> est reconstruit
 * en DOM (wu-obfuscate-rebuild) après décodage pour un comportement 100 % natif
 * (clic milieu, Ctrl+clic, menu contextuel) — au prix d'exposer l'URL en DOM
 * *après* chargement JS (toujours invisible au source statique).
 *
 * Dépendance : aucune.
 *
 * Usage : voir README.md
 */
(function () {
  'use strict';

  const ATTR_TARGET = 'wu-obfuscate';
  const ATTR_TYPE = 'wu-obfuscate-type';        // 'url' (défaut) | 'email' | 'tel'
  const ATTR_TARGET_BLANK = 'wu-obfuscate-blank'; // présence => target _blank
  const ATTR_REBUILD = 'wu-obfuscate-rebuild';  // présence => reconstruit un <a href> natif
  const ATTR_APPLIED = 'wu-obfuscate-applied';

  const TYPE_URL = 'url';
  const TYPE_EMAIL = 'email';
  const TYPE_TEL = 'tel';
  const VALID_TYPES = [TYPE_URL, TYPE_EMAIL, TYPE_TEL];

  function warn() {
    const args = Array.prototype.slice.call(arguments);
    args.unshift('[wu-obfuscate]');
    console.warn.apply(console, args);
  }

  /**
   * Décode une chaîne Base64 en UTF-8 (gère les accents, emojis, etc.).
   * atob() seul casse le multi-octet ; on repasse par decodeURIComponent.
   */
  function decodeBase64(str) {
    try {
      const binary = atob(str.trim());
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return null;
    }
  }

  /**
   * Construit l'URL finale (href) à partir de la valeur décodée + du type.
   */
  function buildHref(decoded, type) {
    if (type === TYPE_EMAIL) return 'mailto:' + decoded;
    if (type === TYPE_TEL) return 'tel:' + decoded.replace(/\s+/g, '');
    return decoded;
  }

  function init() {
    const els = document.querySelectorAll(`[${ATTR_TARGET}]`);
    if (!els.length) return;

    els.forEach(processElement);
  }

  function processElement(el) {
    if (el.hasAttribute(ATTR_APPLIED)) return;

    const raw = el.getAttribute(ATTR_TARGET);
    if (!raw) {
      warn('valeur vide sur', el);
      return;
    }

    const type = (el.getAttribute(ATTR_TYPE) || TYPE_URL).toLowerCase();
    if (VALID_TYPES.indexOf(type) === -1) {
      warn('type invalide:', type, '— attendu url | email | tel.', el);
      return;
    }

    const decoded = decodeBase64(raw);
    if (decoded === null) {
      warn('impossible de décoder le Base64 sur', el);
      return;
    }

    const href = buildHref(decoded, type);
    const blank = el.hasAttribute(ATTR_TARGET_BLANK);

    if (el.hasAttribute(ATTR_REBUILD)) {
      rebuildAnchor(el, href, blank);
    } else {
      wireInteractive(el, href, blank);
    }

    el.setAttribute(ATTR_APPLIED, '');
  }

  /**
   * Mode par défaut : on ne touche pas au href du DOM (rien à harvester même
   * après JS). On rend l'élément cliquable/clavier et on navigue à la main.
   */
  function wireInteractive(el, href, blank) {
    const isNativeAnchor = el.tagName === 'A';

    // Sémantique + focus clavier si ce n'est pas déjà un <a>.
    if (!isNativeAnchor) {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'link');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    }
    el.style.cursor = el.style.cursor || 'pointer';

    const navigate = function () {
      if (blank) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href;
      }
    };

    el.addEventListener('click', function (e) {
      e.preventDefault();
      navigate();
    });

    // Enter / Espace pour l'accessibilité clavier.
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        navigate();
      }
    });
  }

  /**
   * Mode rebuild : reconstruit un vrai <a href> pour un comportement natif
   * (clic milieu, Ctrl+clic, aperçu, menu contextuel). L'URL n'apparaît en
   * DOM qu'après exécution du JS — toujours absente du source HTML statique.
   */
  function rebuildAnchor(el, href, blank) {
    let anchor = el;

    // Si l'élément n'est pas un <a>, on le remplace par un <a> en conservant
    // classes, contenu et attributs data/aria pertinents.
    if (el.tagName !== 'A') {
      anchor = document.createElement('a');
      anchor.className = el.className;
      anchor.innerHTML = el.innerHTML;
      // Recopie les attributs non-internes (garde aria-*, id, style…).
      Array.prototype.forEach.call(el.attributes, function (attr) {
        if (attr.name.indexOf(ATTR_TARGET) === 0) return; // skip wu-obfuscate*
        anchor.setAttribute(attr.name, attr.value);
      });
      el.parentNode.replaceChild(anchor, el);
    }

    anchor.setAttribute('href', href);
    if (blank) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  }

  // Démarrage compatible avec le chargement Webflow.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * Helper console : encode une chaîne (URL, email, numéro) en Base64 UTF-8,
   * prêt à coller dans l'attribut wu-obfuscate.
   *
   *   WU.obfuscate.encode('contact@exemple.com')
   *   // => "Y29udGFjdEBleGVtcGxlLmNvbQ=="
   */
  function encode(str) {
    const bytes = new TextEncoder().encode(String(str));
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  // Expose init() pour le contenu injecté dynamiquement
  // (CMS Load, modals, AJAX, tabs avec contenu lazy…) + encode() pour la console.
  window.WU = window.WU || {};
  window.WU.obfuscate = { init, encode };
})();
