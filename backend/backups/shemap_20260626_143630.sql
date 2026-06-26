--
-- PostgreSQL database dump
--

\restrict 8R5DQ0gXIKcuAmJm2TZ3gVnTcP9RsHlW3gLl8rgxZy05tP8bBYu88MTIecH9dOz

-- Dumped from database version 15.14 (Homebrew)
-- Dumped by pg_dump version 15.14 (Homebrew)

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

ALTER TABLE IF EXISTS ONLY public.trusted_contacts DROP CONSTRAINT IF EXISTS trusted_contacts_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.report_votes DROP CONSTRAINT IF EXISTS report_votes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.report_votes DROP CONSTRAINT IF EXISTS report_votes_report_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journeys DROP CONSTRAINT IF EXISTS journeys_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.journey_events DROP CONSTRAINT IF EXISTS journey_events_journey_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.trusted_contacts DROP CONSTRAINT IF EXISTS trusted_contacts_pkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_pkey;
ALTER TABLE IF EXISTS ONLY public.report_votes DROP CONSTRAINT IF EXISTS report_votes_pkey;
ALTER TABLE IF EXISTS ONLY public.journeys DROP CONSTRAINT IF EXISTS journeys_pkey;
ALTER TABLE IF EXISTS ONLY public.journey_events DROP CONSTRAINT IF EXISTS journey_events_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.trusted_contacts;
DROP TABLE IF EXISTS public.reports;
DROP TABLE IF EXISTS public.report_votes;
DROP TABLE IF EXISTS public.journeys;
DROP TABLE IF EXISTS public.journey_events;
DROP TYPE IF EXISTS public.reportlifecycle;
DROP TYPE IF EXISTS public.reportcategory;
DROP TYPE IF EXISTS public.journeystatus;
--
-- Name: journeystatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.journeystatus AS ENUM (
    'active',
    'delayed',
    'interrupted',
    'completed',
    'sos_active'
);


--
-- Name: reportcategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reportcategory AS ENUM (
    'harassment',
    'catcalling',
    'following',
    'stalking',
    'unsafe_crowd',
    'dark_area',
    'broken_streetlight',
    'suspicious_person',
    'unsafe_shortcut',
    'drunk_individuals'
);


--
-- Name: reportlifecycle; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reportlifecycle AS ENUM (
    'new',
    'verified',
    'trending',
    'resolved',
    'archived'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: journey_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journey_events (
    id character varying NOT NULL,
    journey_id character varying NOT NULL,
    event_type character varying(50) NOT NULL,
    latitude double precision,
    longitude double precision,
    note text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: journeys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journeys (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    origin_lat double precision NOT NULL,
    origin_lng double precision NOT NULL,
    origin_label character varying(300),
    dest_lat double precision NOT NULL,
    dest_lng double precision NOT NULL,
    dest_label character varying(300),
    route_polyline text,
    route_type character varying(50),
    eta_minutes double precision,
    started_at timestamp with time zone DEFAULT now(),
    expected_arrival timestamp with time zone,
    arrived_at timestamp with time zone,
    status public.journeystatus,
    deviation_detected boolean,
    sos_triggered boolean,
    safe_arrival_confirmed boolean,
    safety_score_at_start double precision
);


--
-- Name: report_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_votes (
    id character varying NOT NULL,
    report_id character varying NOT NULL,
    user_id character varying NOT NULL,
    vote_type character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    category public.reportcategory NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    location_label character varying(300),
    severity integer,
    trust_score double precision,
    lifecycle public.reportlifecycle,
    is_verified boolean,
    media_urls text,
    upvote_count integer,
    downvote_count integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Name: trusted_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_contacts (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(200),
    relationship_type character varying(50),
    priority integer,
    notify_on_sos boolean,
    notify_on_arrival boolean,
    notify_on_delay boolean,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    display_name character varying,
    photo_url character varying,
    trust_score double precision,
    reports_submitted integer,
    verified_reports integer,
    upvotes_received integer,
    community_impact integer,
    is_active boolean,
    home_address text,
    work_address text,
    college_address text,
    hostel_address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


--
-- Data for Name: journey_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journey_events (id, journey_id, event_type, latitude, longitude, note, created_at) FROM stdin;
\.


--
-- Data for Name: journeys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journeys (id, user_id, origin_lat, origin_lng, origin_label, dest_lat, dest_lng, dest_label, route_polyline, route_type, eta_minutes, started_at, expected_arrival, arrived_at, status, deviation_detected, sos_triggered, safe_arrival_confirmed, safety_score_at_start) FROM stdin;
\.


--
-- Data for Name: report_votes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_votes (id, report_id, user_id, vote_type, created_at) FROM stdin;
c82bf00c-ac50-4ca9-bc6a-6fba66f03b11	d793359f-00a0-4259-a2b2-b8f713c12b26	wOcItvzgNGTZZsdSHUN3x3GMM8L2	up	2026-06-26 01:18:30.465175+05:30
4ebe5690-c963-4b62-95b6-5b77268ee1df	6ffe0281-7299-43b6-bb9f-b716530a2804	wOcItvzgNGTZZsdSHUN3x3GMM8L2	down	2026-06-26 02:04:35.251064+05:30
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reports (id, user_id, category, title, description, latitude, longitude, location_label, severity, trust_score, lifecycle, is_verified, media_urls, upvote_count, downvote_count, created_at, updated_at) FROM stdin;
eb297b73-4dfc-4844-bba2-ffb6d901f57e	wOcItvzgNGTZZsdSHUN3x3GMM8L2	stalking	Stalking near station	Stalking incident reported close to the railway station.	25.5606	85.1765	seed	3	94.52	trending	t	\N	12	1	2026-06-25 17:35:19.936634+05:30	2026-06-26 01:55:19.981649+05:30
d793359f-00a0-4259-a2b2-b8f713c12b26	wOcItvzgNGTZZsdSHUN3x3GMM8L2	harassment	Got harassed by an uncle in mid 40s	I was going to Iskcon temple today and on my way, I stopped at a tea stall to drink tea. There a man started misbehaving with me, staring at me and passing out inappropriate comments. Even after saying I was uncomfortable, he still continued.	25.620655834263527	85.1265039191921	\N	3	63.64	new	f	\N	1	0	2026-06-26 01:18:26.373602+05:30	2026-06-26 01:18:30.465175+05:30
469549d3-6d1a-4f31-8a6d-4f61768858cd	wOcItvzgNGTZZsdSHUN3x3GMM8L2	harassment	Street harassment near market	Group of men harassing women walking alone after dusk. Avoid if possible.	25.6216	85.1125	seed	3	100.83	trending	t	\N	14	1	2026-06-26 01:20:19.936634+05:30	2026-06-26 01:55:19.93801+05:30
5c3bac8d-95ce-4b35-9b29-d6963d9cd13f	wOcItvzgNGTZZsdSHUN3x3GMM8L2	stalking	Reported stalking	Someone followed a commuter for two blocks before she reached a shop.	25.6186	85.1105	seed	3	94.55	trending	t	\N	11	1	2026-06-26 00:25:19.936634+05:30	2026-06-26 01:55:19.944964+05:30
61f2b323-cb61-413c-9227-26ba382370f9	wOcItvzgNGTZZsdSHUN3x3GMM8L2	dark_area	Long unlit stretch	No working street lights for ~300m. Very dark and isolated at night.	25.6236	85.1145	seed	3	90.26	verified	t	\N	8	0	2026-06-25 23:25:19.936634+05:30	2026-06-26 01:55:19.948855+05:30
2ec5b7e5-83d8-4039-ba27-7fbacb975cb9	wOcItvzgNGTZZsdSHUN3x3GMM8L2	broken_streetlight	Broken streetlights	Several streetlights out near the underpass.	25.6166	85.1085	seed	2	78.91	verified	t	\N	5	0	2026-06-25 22:15:19.936634+05:30	2026-06-26 01:55:19.95148+05:30
073a6dfe-3066-401c-8b8e-15031b0e5ecd	wOcItvzgNGTZZsdSHUN3x3GMM8L2	drunk_individuals	Drunk group loitering	Group drinking and loitering near the corner late at night.	25.6196	85.1065	seed	2	61.51	new	f	\N	4	0	2026-06-25 20:55:19.936634+05:30	2026-06-26 01:55:19.957699+05:30
9a04b66a-70fc-434d-b290-8de150de3ecb	wOcItvzgNGTZZsdSHUN3x3GMM8L2	suspicious_person	Suspicious person	A person watching passers-by near the ATM. Felt unsafe.	25.6326	85.1275	seed	2	60.78	new	f	\N	3	0	2026-06-26 01:10:19.936634+05:30	2026-06-26 01:55:19.960793+05:30
51430872-9ed7-426e-a875-49ff7970ef4e	wOcItvzgNGTZZsdSHUN3x3GMM8L2	unsafe_crowd	Rowdy crowd	Large unmanaged crowd blocking the footpath in the evening.	25.6356	85.1245	seed	2	81.36	verified	t	\N	6	0	2026-06-25 23:45:19.936634+05:30	2026-06-26 01:55:19.965365+05:30
1f9effc6-9c3f-4ecf-b174-bfca546f314a	wOcItvzgNGTZZsdSHUN3x3GMM8L2	suspicious_person	Minor concern	One report of someone loitering, otherwise area seems active.	25.6216	85.1405	seed	1	54.81	new	f	\N	2	0	2026-06-25 21:55:19.936634+05:30	2026-06-26 01:55:19.972708+05:30
c6b51ed8-a3f4-4f36-86f5-14955d888751	wOcItvzgNGTZZsdSHUN3x3GMM8L2	broken_streetlight	One light out	A single streetlight is flickering near the park gate.	25.6186	85.1425	seed	1	52.61	new	f	\N	1	0	2026-06-25 21:15:19.936634+05:30	2026-06-26 01:55:19.97495+05:30
1d509263-afc7-4c1c-8c0b-27f62d37d63e	wOcItvzgNGTZZsdSHUN3x3GMM8L2	harassment	Harassment downtown	Harassment reported in the central market district.	25.6706	85.1665	seed	3	105.02	trending	t	\N	18	2	2026-06-25 19:15:19.936634+05:30	2026-06-26 01:55:19.978566+05:30
f0d9776a-beac-4c09-8c58-f0faaf421ec5	wOcItvzgNGTZZsdSHUN3x3GMM8L2	dark_area	Unlit highway stretch	Long dark stretch on the outer road, very few people around.	25.7006	85.0565	seed	2	79.02	verified	t	\N	6	0	2026-06-25 15:55:19.936634+05:30	2026-06-26 01:55:19.983945+05:30
998aeac2-18a6-4fe6-a5e1-6e9dce204d67	wOcItvzgNGTZZsdSHUN3x3GMM8L2	following	Man following women	Repeated reports of a man following women near the bus stop.	25.6256	85.1135	seed	3	77.29	new	f	\N	9	1	2026-06-26 00:55:19.936634+05:30	2026-06-26 02:04:32.100423+05:30
6ffe0281-7299-43b6-bb9f-b716530a2804	wOcItvzgNGTZZsdSHUN3x3GMM8L2	catcalling	Catcalling reported	Catcalling from a parked vehicle reported by two users.	25.6306	85.1305	seed	2	67.6	new	f	\N	7	1	2026-06-25 22:35:19.936634+05:30	2026-06-26 02:04:35.251064+05:30
\.


--
-- Data for Name: trusted_contacts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trusted_contacts (id, user_id, name, phone, email, relationship_type, priority, notify_on_sos, notify_on_arrival, notify_on_delay, created_at) FROM stdin;
5aee4481-6dea-4a47-849d-17e63ae632bd	wOcItvzgNGTZZsdSHUN3x3GMM8L2	Didi	9162585432	\N	Sister	1	t	t	t	2026-06-26 01:20:02.993249+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, display_name, photo_url, trust_score, reports_submitted, verified_reports, upvotes_received, community_impact, is_active, home_address, work_address, college_address, hostel_address, created_at, updated_at) FROM stdin;
wOcItvzgNGTZZsdSHUN3x3GMM8L2	snehil.yash13@gmail.com	Snehil Yash	\N	0	1	0	0	0	t	\N	\N	\N	\N	2026-06-26 00:22:21.073437+05:30	2026-06-26 01:18:26.390512+05:30
\.


--
-- Name: journey_events journey_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_events
    ADD CONSTRAINT journey_events_pkey PRIMARY KEY (id);


--
-- Name: journeys journeys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journeys
    ADD CONSTRAINT journeys_pkey PRIMARY KEY (id);


--
-- Name: report_votes report_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_votes
    ADD CONSTRAINT report_votes_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: trusted_contacts trusted_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_contacts
    ADD CONSTRAINT trusted_contacts_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: journey_events journey_events_journey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journey_events
    ADD CONSTRAINT journey_events_journey_id_fkey FOREIGN KEY (journey_id) REFERENCES public.journeys(id);


--
-- Name: journeys journeys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journeys
    ADD CONSTRAINT journeys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: report_votes report_votes_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_votes
    ADD CONSTRAINT report_votes_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id);


--
-- Name: report_votes report_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_votes
    ADD CONSTRAINT report_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: trusted_contacts trusted_contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_contacts
    ADD CONSTRAINT trusted_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 8R5DQ0gXIKcuAmJm2TZ3gVnTcP9RsHlW3gLl8rgxZy05tP8bBYu88MTIecH9dOz

