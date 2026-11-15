# [CORRECTIF V3] Assainissement du HTML stocké (anti-XSS stocké).
# On n'autorise qu'une liste blanche de balises de mise en forme simples :
# tout <script>, gestionnaire d'événement (onload, onclick...) ou URL
# "javascript:" est supprimé avant enregistrement en base.
import bleach

ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li", "span"]
ALLOWED_ATTRS: dict[str, list[str]] = {}


def clean_html(value: str | None) -> str | None:
    if value is None:
        return None
    return bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
