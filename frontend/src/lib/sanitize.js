// [CORRECTIF V3] Assainissement du HTML côté client (défense en profondeur).
// On n'autorise qu'une liste blanche de balises de mise en forme et on retire
// tout <script>, attribut d'événement (onclick, onerror...) et URL javascript:.
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'P', 'BR', 'UL', 'OL', 'LI', 'SPAN'])

export function sanitizeHtml(dirty) {
  if (!dirty) return ''
  const tpl = document.createElement('template')
  tpl.innerHTML = String(dirty)
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 1) {
        if (!ALLOWED.has(child.tagName)) {
          // Balise non autorisée : on garde le texte, on jette la balise.
          child.replaceWith(document.createTextNode(child.textContent || ''))
          continue
        }
        // On supprime tous les attributs (plus d'event handler ni de href/src piégé).
        for (const attr of [...child.attributes]) child.removeAttribute(attr.name)
        walk(child)
      }
    }
  }
  walk(tpl.content)
  return tpl.innerHTML
}
