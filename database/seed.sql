-- =============================================================================
--  JobBoard Secure — Données de démonstration (FICTIVES)
--  Projet DevSecOps — TEK-UP 2026-2027 — Aya Abdallah & Ameni Azouz
--  4 comptes (admin + 1 recruteur + 2 candidates), 2 offres, 2 CV, 2 candidatures.
--  À exécuter APRÈS database/schema.sql :  psql -U jobboard -d jobboard -f database/seed.sql
--  PDF des CV dans backend/uploads/. (Sinon l app insère ces données au 1er démarrage.)
-- =============================================================================

--
-- PostgreSQL database dump
--

\restrict xCKWTIdy6LtzdH7jTqiBcnq5hbH74b7t61dX6qplRHwxUaEUvNmiR5SZ0XNcKDB

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, 'admin@jobboard.local', '0192023a7bbd73250516f069df18b500', 'Administrateur JobBoard', 'admin', true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-13 00:17:08.449449');
INSERT INTO public.users VALUES (2, 'recruteur@techvision.tn', '4c424810591245425e70f225781288f9', 'Sami Ben Salah', 'recruteur', true, '+216 71 000 101', NULL, 'Tunis', NULL, 'Talent Acquisition Manager', NULL, NULL, 'TechVision', '2026-11-13 00:17:08.449449');
INSERT INTO public.users VALUES (3, 'aya.abdallah@gmail.com', 'a515d3ef1e0ad73a04834d7a26b334a7', 'Aya Abdallah', 'candidat', true, '+216 50 100 001', '14 rue des Jasmins, La Marsa', 'Tunis', '2001-04-12', 'Ingénieure en cybersécurité', '<p>Ingénieure en <b>cybersécurité</b>, orientée <b>DevSecOps</b> : intégration de contrôles de sécurité dans les pipelines CI/CD (SAST, scan d''images, DAST) et test d''intrusion.</p>', 'DevSecOps, Pentest, OWASP Top 10, Docker, Kubernetes', NULL, '2026-11-13 00:17:08.449449');
INSERT INTO public.users VALUES (4, 'ameni.azouz@gmail.com', '364dba702c3ebbf4e5581f22aec4e5ca', 'Ameni Azouz', 'candidat', true, '+216 50 100 002', '3 avenue Habib Bourguiba, Ariana', 'Ariana', '2001-09-27', 'Ingénieure en cybersécurité', '<p>Ingénieure en <b>cybersécurité</b> défensive (<i>Blue Team</i>) : supervision SOC, détection, réponse à incident et renseignement sur les menaces.</p>', 'SOC, SIEM, Threat Intelligence, Réponse à incident', NULL, '2026-11-13 00:17:08.449449');


--
-- Data for Name: cvs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cvs VALUES (1, 3, 'CV_Aya_Abdallah.pdf', '/uploads/CV_Aya_Abdallah.pdf', 'application/pdf', 923, '2026-11-13 00:17:08.449449');
INSERT INTO public.cvs VALUES (2, 4, 'CV_Ameni_Azouz.pdf', '/uploads/CV_Ameni_Azouz.pdf', 'application/pdf', 920, '2026-11-13 00:17:08.449449');


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.jobs VALUES (1, 2, 'Ingénieur DevSecOps', 'TechVision', 'Tunis', 'CDI', '3 500 – 4 500 TND', 'Hybride', '<p>Intégrez la sécurité dans nos chaînes <b>CI/CD</b> : SAST, analyse de dépendances, scan d''images, DAST.</p><ul><li>Jenkins, GitLab CI</li><li>Semgrep, Trivy, Gitleaks, OWASP ZAP</li><li>Docker, Kubernetes</li></ul>', 'Expérience Docker/Kubernetes, connaissance de l''OWASP Top 10', 'published', '2026-11-13 00:17:08.449449', '2026-11-13 00:17:08.449449');
INSERT INTO public.jobs VALUES (2, 2, 'Analyste SOC N2', 'TechVision', 'Tunis', 'CDI', '3 000 – 3 900 TND', 'Sur site', '<p>Investigation approfondie des incidents de sécurité au sein de notre <b>SOC</b>.</p><ul><li>Analyse d''alertes complexes</li><li>Corrélation SIEM</li><li>MITRE ATT&CK</li></ul>', '2 ans en SOC, maîtrise d''un SIEM', 'published', '2026-11-13 00:17:08.449449', '2026-11-13 00:17:08.449449');


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.applications VALUES (1, 1, 3, 1, 'Ingénieure cybersécurité orientée DevSecOps, votre offre correspond à mon profil.', 'en_revue', '2026-11-13 00:17:08.449449', '2026-11-13 00:17:08.449449');
INSERT INTO public.applications VALUES (2, 2, 4, 2, 'Analyste défensive, je suis à l''aise avec le SIEM et MITRE ATT&CK.', 'envoyee', '2026-11-13 00:17:08.449449', '2026-11-13 00:17:08.449449');


--
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.applications_id_seq', 2, true);


--
-- Name: cvs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cvs_id_seq', 2, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jobs_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict xCKWTIdy6LtzdH7jTqiBcnq5hbH74b7t61dX6qplRHwxUaEUvNmiR5SZ0XNcKDB

