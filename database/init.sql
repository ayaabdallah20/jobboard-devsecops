-- Création de l'utilisateur et de la base PostgreSQL (valeurs FICTIVES de laboratoire)
-- Exécuter avec :  psql -U postgres -f database/init.sql
CREATE USER jobboard WITH PASSWORD 'jobboard123';
CREATE DATABASE jobboard OWNER jobboard;
-- Ensuite, créer les tables avec notre schéma :
--   psql -U jobboard -d jobboard -f database/schema.sql
-- Les données de démonstration sont insérées au premier démarrage du backend.
