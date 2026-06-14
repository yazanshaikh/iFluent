--
-- PostgreSQL database dump
--

\restrict Zf8UMI24YA5jgzn5UXXciVilfvGuepXsyL8FrF0kwLLsSs8Hj7RFeSzdodQMyUU

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_message_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_message_recipients (
    id bigint NOT NULL,
    admin_message_id bigint NOT NULL,
    user_id bigint NOT NULL,
    read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: admin_message_recipients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_message_recipients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_message_recipients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_message_recipients_id_seq OWNED BY public.admin_message_recipients.id;


--
-- Name: admin_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_messages (
    id bigint NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    target character varying(255) NOT NULL,
    sent_by bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT admin_messages_target_check CHECK (((target)::text = ANY ((ARRAY['all'::character varying, 'subscribers'::character varying, 'non_subscribers'::character varying])::text[])))
);


--
-- Name: admin_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_messages_id_seq OWNED BY public.admin_messages.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: curriculum_pdfs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.curriculum_pdfs (
    id bigint NOT NULL,
    level_code character varying(10) NOT NULL,
    lesson_number smallint NOT NULL,
    pdf_url character varying(255) NOT NULL,
    original_filename character varying(255),
    updated_by bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: curriculum_pdfs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.curriculum_pdfs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: curriculum_pdfs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.curriculum_pdfs_id_seq OWNED BY public.curriculum_pdfs.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: group_class_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_class_registrations (
    id bigint NOT NULL,
    group_class_id bigint NOT NULL,
    student_id bigint NOT NULL,
    registered_at timestamp(0) without time zone NOT NULL,
    joined_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: group_class_registrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_class_registrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_class_registrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_class_registrations_id_seq OWNED BY public.group_class_registrations.id;


--
-- Name: group_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_classes (
    id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    lesson_id bigint,
    scheduled_at timestamp(0) without time zone NOT NULL,
    max_seats smallint DEFAULT '20'::smallint NOT NULL,
    registered_count smallint DEFAULT '0'::smallint NOT NULL,
    status character varying(255) DEFAULT 'scheduled'::character varying NOT NULL,
    daily_room_name character varying(255),
    daily_room_url character varying(500),
    started_at timestamp(0) without time zone,
    ended_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    CONSTRAINT group_classes_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: group_classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_classes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_classes_id_seq OWNED BY public.group_classes.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: lead_remarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_remarks (
    id bigint NOT NULL,
    lead_id bigint NOT NULL,
    staff_id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);


--
-- Name: lead_remarks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lead_remarks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lead_remarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lead_remarks_id_seq OWNED BY public.lead_remarks.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    source character varying(255),
    age smallint,
    status character varying(30) DEFAULT 'new'::character varying NOT NULL,
    assigned_to bigint,
    is_small_treasure boolean DEFAULT false NOT NULL,
    moved_to_open_sea_at timestamp(0) without time zone,
    converted_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    first_assigned_to bigint,
    scheduled_at timestamp(0) without time zone,
    CONSTRAINT leads_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'in_progress'::character varying, 'interested'::character varying, 'not_interested'::character varying, 'postponed'::character varying, 'open_sea'::character varying, 'subscriber'::character varying])::text[])))
);


--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: lesson_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_bookings (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    level_code character varying(10) NOT NULL,
    lesson_number smallint NOT NULL,
    scheduled_at timestamp(0) without time zone NOT NULL,
    teacher_id bigint,
    teacher_code character varying(20),
    session_url character varying(255),
    status character varying(255) DEFAULT 'scheduled'::character varying NOT NULL,
    quiz_locked boolean DEFAULT false NOT NULL,
    quiz_attempts smallint DEFAULT '0'::smallint NOT NULL,
    quiz_score smallint,
    quiz_passed_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT lesson_bookings_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: lesson_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lesson_bookings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lesson_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lesson_bookings_id_seq OWNED BY public.lesson_bookings.id;


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id bigint NOT NULL,
    level_id bigint NOT NULL,
    unit_id bigint,
    title character varying(255) NOT NULL,
    description text,
    "order" smallint NOT NULL,
    nearpod_lesson_id character varying(255),
    nearpod_url character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    is_assessment boolean DEFAULT false NOT NULL,
    pdf_url character varying(255),
    activity_url character varying(255)
);


--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lessons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.levels (
    id bigint NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(255) NOT NULL,
    name_en character varying(255) NOT NULL,
    description text,
    "order" smallint NOT NULL,
    total_units smallint NOT NULL,
    total_lessons smallint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: levels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.levels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.levels_id_seq OWNED BY public.levels.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notebook_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notebook_entries (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    title character varying(255),
    content text NOT NULL,
    lesson_id bigint,
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    category character varying(255) DEFAULT 'general'::character varying NOT NULL
);


--
-- Name: notebook_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notebook_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notebook_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notebook_entries_id_seq OWNED BY public.notebook_entries.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    type character varying(255) NOT NULL,
    notifiable_type character varying(255) NOT NULL,
    notifiable_id bigint NOT NULL,
    data text NOT NULL,
    read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_codes (
    id bigint NOT NULL,
    phone character varying(20) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp(0) without time zone NOT NULL,
    used_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: otp_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otp_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otp_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otp_codes_id_seq OWNED BY public.otp_codes.id;


--
-- Name: packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.packages (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    levels_included jsonb DEFAULT '[]'::jsonb NOT NULL,
    price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: packages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.packages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.packages_id_seq OWNED BY public.packages.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: payment_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_accounts (
    id bigint NOT NULL,
    alias character varying(255) NOT NULL,
    cliq_name character varying(255) NOT NULL,
    sort_order integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: payment_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_accounts_id_seq OWNED BY public.payment_accounts.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    selected_question_ids jsonb NOT NULL,
    submitted_answers jsonb,
    score smallint,
    correct_count smallint,
    total_questions smallint,
    passed boolean DEFAULT false NOT NULL,
    started_at timestamp(0) without time zone NOT NULL,
    submitted_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_attempts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_attempts_id_seq OWNED BY public.quiz_attempts.id;


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    question text NOT NULL,
    options jsonb NOT NULL,
    correct_answer smallint NOT NULL,
    "order" smallint DEFAULT '0'::smallint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_questions_id_seq OWNED BY public.quiz_questions.id;


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    type character varying(255) DEFAULT 'lesson'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    questions_per_attempt smallint DEFAULT '10'::smallint NOT NULL,
    min_bank_size smallint DEFAULT '10'::smallint NOT NULL,
    CONSTRAINT quizzes_type_check CHECK (((type)::text = ANY ((ARRAY['lesson'::character varying, 'comprehensive'::character varying])::text[])))
);


--
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quizzes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


--
-- Name: session_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_ratings (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    student_id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    rating smallint NOT NULL,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: session_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_ratings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_ratings_id_seq OWNED BY public.session_ratings.id;


--
-- Name: session_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_requests (
    id bigint NOT NULL,
    type character varying(255) NOT NULL,
    requested_by bigint,
    student_id bigint,
    target_teacher_id bigint,
    assigned_teacher_id bigint,
    lesson_id bigint,
    lead_id bigint,
    requested_at_utc timestamp(0) without time zone NOT NULL,
    confirmed_at timestamp(0) without time zone,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    rejection_reason text,
    cancellation_reason text,
    session_id bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    teacher_gender_pref character varying(10),
    note text,
    CONSTRAINT session_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'rejected'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[]))),
    CONSTRAINT session_requests_teacher_gender_pref_check CHECK (((teacher_gender_pref)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying])::text[]))),
    CONSTRAINT session_requests_type_check CHECK (((type)::text = ANY ((ARRAY['demo'::character varying, 'core'::character varying, 'private'::character varying, 'group'::character varying])::text[])))
);


--
-- Name: session_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_requests_id_seq OWNED BY public.session_requests.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    student_id bigint NOT NULL,
    status character varying(255) DEFAULT 'waiting'::character varying NOT NULL,
    daily_room_name character varying(255),
    daily_room_url character varying(255),
    nearpod_pin character varying(20),
    scheduled_at timestamp(0) without time zone,
    started_at timestamp(0) without time zone,
    ended_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    student_joined_at timestamp(0) without time zone,
    teacher_joined_at timestamp(0) without time zone,
    attendance_status character varying(255),
    teacher_present boolean DEFAULT false NOT NULL,
    student_present boolean DEFAULT false NOT NULL,
    teacher_started_at timestamp(0) without time zone,
    teacher_ended_at timestamp(0) without time zone,
    evaluation_submitted_at timestamp(0) without time zone,
    reminder_sent_at timestamp(0) without time zone,
    CONSTRAINT sessions_attendance_status_check CHECK (((attendance_status)::text = ANY ((ARRAY['attended'::character varying, 'absent'::character varying, 'teacher_absent'::character varying])::text[]))),
    CONSTRAINT sessions_status_check CHECK (((status)::text = ANY ((ARRAY['waiting'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id bigint NOT NULL,
    key character varying(255) NOT NULL,
    value jsonb,
    type character varying(20) DEFAULT 'text'::character varying NOT NULL,
    label character varying(255),
    "group" character varying(50) DEFAULT 'general'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.site_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: student_curriculum_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_curriculum_assignments (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    level_code character varying(10) NOT NULL,
    from_lesson smallint NOT NULL,
    to_lesson smallint NOT NULL,
    next_lesson smallint NOT NULL,
    assigned_by bigint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: student_curriculum_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_curriculum_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_curriculum_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_curriculum_assignments_id_seq OWNED BY public.student_curriculum_assignments.id;


--
-- Name: student_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_progress (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    lesson_id bigint NOT NULL,
    quiz_id bigint,
    score smallint,
    attempts smallint DEFAULT '0'::smallint NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    passed_at timestamp(0) without time zone,
    lesson_completed boolean DEFAULT false NOT NULL,
    completed_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: student_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_progress_id_seq OWNED BY public.student_progress.id;


--
-- Name: student_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_units (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    unit_id bigint NOT NULL,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    enrolled_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT student_units_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: student_units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_units_id_seq OWNED BY public.student_units.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    lead_id bigint,
    profile_photo character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.students_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    package_id bigint,
    activated_by bigint,
    approved_by bigint,
    status character varying(255) DEFAULT 'pending_approval'::character varying NOT NULL,
    amount_paid numeric(10,2),
    payment_method character varying(255),
    payment_reference character varying(255),
    payment_screenshot character varying(255),
    activated_at timestamp(0) without time zone,
    approved_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    invoice_uuid uuid,
    months_count smallint DEFAULT '1'::smallint NOT NULL,
    payment_account_id bigint,
    lessons_count smallint,
    from_lesson_id bigint,
    to_lesson_id bigint,
    current_lesson_id bigint,
    CONSTRAINT subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['pending_screenshot'::character varying, 'pending_approval'::character varying, 'active'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: teacher_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_availability (
    id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    day_of_week smallint NOT NULL,
    start_time time(0) without time zone NOT NULL,
    end_time time(0) without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: teacher_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teacher_availability_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teacher_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teacher_availability_id_seq OWNED BY public.teacher_availability.id;


--
-- Name: teacher_earnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_earnings (
    id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    session_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    session_type character varying(20) DEFAULT 'core'::character varying NOT NULL,
    notes text,
    credited_at timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: teacher_earnings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teacher_earnings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teacher_earnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teacher_earnings_id_seq OWNED BY public.teacher_earnings.id;


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    teacher_code character varying(20) NOT NULL,
    bio text,
    specialization character varying(255),
    profile_photo character varying(255),
    commission_rate numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    zoom_user_id character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    sessions_count_reset_at timestamp(0) without time zone,
    balance_reset_at timestamp without time zone,
    absences_reset_at timestamp without time zone
);


--
-- Name: teachers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teachers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teachers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teachers_id_seq OWNED BY public.teachers.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id bigint NOT NULL,
    level_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    name_en character varying(255),
    "order" smallint NOT NULL,
    lesson_count smallint DEFAULT '12'::smallint NOT NULL,
    has_end_test boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20),
    email character varying(255),
    email_verified_at timestamp(0) without time zone,
    password character varying(255),
    role character varying(255) NOT NULL,
    timezone character varying(50) DEFAULT 'Asia/Amman'::character varying NOT NULL,
    fcm_token character varying(255),
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    lesson_credits integer DEFAULT 0 NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'cc'::character varying, 'ss'::character varying, 'teacher'::character varying, 'student'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_message_recipients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_message_recipients ALTER COLUMN id SET DEFAULT nextval('public.admin_message_recipients_id_seq'::regclass);


--
-- Name: admin_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages ALTER COLUMN id SET DEFAULT nextval('public.admin_messages_id_seq'::regclass);


--
-- Name: curriculum_pdfs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_pdfs ALTER COLUMN id SET DEFAULT nextval('public.curriculum_pdfs_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: group_class_registrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_class_registrations ALTER COLUMN id SET DEFAULT nextval('public.group_class_registrations_id_seq'::regclass);


--
-- Name: group_classes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_classes ALTER COLUMN id SET DEFAULT nextval('public.group_classes_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: lead_remarks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_remarks ALTER COLUMN id SET DEFAULT nextval('public.lead_remarks_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: lesson_bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_bookings ALTER COLUMN id SET DEFAULT nextval('public.lesson_bookings_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: levels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.levels ALTER COLUMN id SET DEFAULT nextval('public.levels_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: notebook_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notebook_entries ALTER COLUMN id SET DEFAULT nextval('public.notebook_entries_id_seq'::regclass);


--
-- Name: otp_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes ALTER COLUMN id SET DEFAULT nextval('public.otp_codes_id_seq'::regclass);


--
-- Name: packages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packages ALTER COLUMN id SET DEFAULT nextval('public.packages_id_seq'::regclass);


--
-- Name: payment_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_accounts ALTER COLUMN id SET DEFAULT nextval('public.payment_accounts_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: quiz_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts ALTER COLUMN id SET DEFAULT nextval('public.quiz_attempts_id_seq'::regclass);


--
-- Name: quiz_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.quiz_questions_id_seq'::regclass);


--
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- Name: session_ratings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_ratings ALTER COLUMN id SET DEFAULT nextval('public.session_ratings_id_seq'::regclass);


--
-- Name: session_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests ALTER COLUMN id SET DEFAULT nextval('public.session_requests_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Name: student_curriculum_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_curriculum_assignments ALTER COLUMN id SET DEFAULT nextval('public.student_curriculum_assignments_id_seq'::regclass);


--
-- Name: student_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress ALTER COLUMN id SET DEFAULT nextval('public.student_progress_id_seq'::regclass);


--
-- Name: student_units id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_units ALTER COLUMN id SET DEFAULT nextval('public.student_units_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: teacher_availability id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_availability ALTER COLUMN id SET DEFAULT nextval('public.teacher_availability_id_seq'::regclass);


--
-- Name: teacher_earnings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_earnings ALTER COLUMN id SET DEFAULT nextval('public.teacher_earnings_id_seq'::regclass);


--
-- Name: teachers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers ALTER COLUMN id SET DEFAULT nextval('public.teachers_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admin_message_recipients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_message_recipients (id, admin_message_id, user_id, read_at, created_at, updated_at) FROM stdin;
1	1	17	\N	2026-05-29 19:31:17	2026-05-29 19:31:17
2	1	18	\N	2026-05-29 19:31:17	2026-05-29 19:31:17
3	1	19	\N	2026-05-29 19:31:17	2026-05-29 19:31:17
5	1	21	\N	2026-05-29 19:31:17	2026-05-29 19:31:17
6	1	22	\N	2026-05-29 19:31:17	2026-05-29 19:31:17
8	2	17	\N	2026-05-29 19:40:35	2026-05-29 19:40:35
9	2	18	\N	2026-05-29 19:40:35	2026-05-29 19:40:35
10	2	19	\N	2026-05-29 19:40:35	2026-05-29 19:40:35
12	2	21	\N	2026-05-29 19:40:35	2026-05-29 19:40:35
13	2	22	\N	2026-05-29 19:40:35	2026-05-29 19:40:35
15	3	17	\N	2026-05-29 19:42:05	2026-05-29 19:42:05
16	3	18	\N	2026-05-29 19:42:05	2026-05-29 19:42:05
17	3	19	\N	2026-05-29 19:42:05	2026-05-29 19:42:05
19	3	21	\N	2026-05-29 19:42:05	2026-05-29 19:42:05
20	3	22	\N	2026-05-29 19:42:05	2026-05-29 19:42:05
22	4	22	\N	2026-06-09 21:51:30	2026-06-09 21:51:30
25	4	17	\N	2026-06-09 21:51:30	2026-06-09 21:51:30
26	4	18	\N	2026-06-09 21:51:30	2026-06-09 21:51:30
27	4	19	\N	2026-06-09 21:51:30	2026-06-09 21:51:30
28	4	21	\N	2026-06-09 21:51:30	2026-06-09 21:51:30
30	4	40	\N	2026-06-09 21:51:30	2026-06-09 21:51:30
24	4	29	2026-06-09 21:52:29	2026-06-09 21:51:30	2026-06-09 21:51:30
29	4	39	2026-06-10 15:55:55	2026-06-09 21:51:30	2026-06-09 21:51:30
\.


--
-- Data for Name: admin_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_messages (id, title, body, target, sent_by, created_at, updated_at) FROM stdin;
1	تجربة	رسالة للجميع	all	1	2026-05-29 19:31:17	2026-05-29 19:31:17
2	المشتركين	كيفكم	all	1	2026-05-29 19:40:35	2026-05-29 19:40:35
3	من يزن	كيف الحال	all	1	2026-05-29 19:42:05	2026-05-29 19:42:05
4	بحبيب	بيبيبيسسسسس	all	1	2026-06-09 21:51:30	2026-06-09 21:51:30
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cache (key, value, expiration) FROM stdin;
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: curriculum_pdfs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.curriculum_pdfs (id, level_code, lesson_number, pdf_url, original_filename, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
1	4586c648-4299-40f8-b0b1-66caebe71306	redis	default	{"uuid":"4586c648-4299-40f8-b0b1-66caebe71306","timeout":null,"id":"7BbHz4heAYfO40I9e9yLXtXVU9WXCryM","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:17;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:2;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.lead\\";i:2;s:12:\\"student.user\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"53ea3974-ca6a-4d33-af7b-62dbdb9c7029\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '7fd1e92f-5116-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-20 00:10:16
2	d9edb792-ffc5-4f1b-97a5-2e511c9fae73	redis	default	{"uuid":"d9edb792-ffc5-4f1b-97a5-2e511c9fae73","timeout":null,"id":"VWIeO0I6WbYW1KZJzLIL0I3tk8UHBy5J","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:18;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:3;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.lead\\";i:2;s:12:\\"student.user\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"8d620469-dfb3-451c-9058-92bb3e230fa7\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), 'f620a820-e7f7-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-20 00:30:33
3	a7c3fcda-7a79-4040-9703-cf3c3a71c8c7	redis	default	{"uuid":"a7c3fcda-7a79-4040-9703-cf3c3a71c8c7","timeout":null,"id":"mrjLcSnJgwc4c8Tcex3gWBggNoS96HoE","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:19;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:4;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.lead\\";i:2;s:12:\\"student.user\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"d2111522-e7ad-4c28-932d-1cdf8d196336\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '24a88abf-e6ad-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-20 00:38:54
4	bf3a62b7-7090-406a-aa66-4f3f795958d2	redis	default	{"uuid":"bf3a62b7-7090-406a-aa66-4f3f795958d2","timeout":null,"id":"qfxb7jqAKI0HmlwbkyuIN5W78Z2foZus","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:20;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:5;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.lead\\";i:2;s:12:\\"student.user\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"b5dbfc07-1e46-43b8-8208-7f6ebeaf22c6\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), 'b6160716-9de2-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-20 00:40:34
5	7f177d38-71ce-4ec6-b1e9-4ed3da0d431d	redis	default	{"uuid":"7f177d38-71ce-4ec6-b1e9-4ed3da0d431d","timeout":null,"id":"5Ey4IJ4UAngBQPCyyUltc1XQXIJOBV9l","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:20;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:6;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.lead\\";i:2;s:12:\\"student.user\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"ec0f075b-9e6b-4116-add7-68be201f98df\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '55a141da-c862-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-20 01:02:28
6	502e6cd7-14ee-422f-b9e8-622886f72253	redis	default	{"uuid":"502e6cd7-14ee-422f-b9e8-622886f72253","timeout":null,"id":"OOsOglzDSXOm3JPmussYxJvcwZS56Uzd","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:17;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:7;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.lead\\";i:2;s:12:\\"student.user\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"efd02906-427d-48f3-b2fd-e9600ab4d99d\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '6cf2faf9-0030-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-20 01:03:55
7	07385f1b-98b4-4c4d-b8ca-c68f67f99d71	redis	default	{"uuid":"07385f1b-98b4-4c4d-b8ca-c68f67f99d71","timeout":null,"id":"Ywt5zMryzqxY77yt1cDD5WxnNPSv90qF","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:21;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:8;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.lead\\";i:2;s:12:\\"student.user\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"2dd57339-dadf-4b06-b80d-2bedd58ed4f8\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '0c96b4e1-b369-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-20 02:24:07
8	e3996b56-c92e-44a3-8408-5c80d806521c	redis	default	{"uuid":"e3996b56-c92e-44a3-8408-5c80d806521c","timeout":null,"id":"0r6mIxyuhDj7jToDyhHt9LzoSNHIFIw4","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:23;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:9;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.lead\\";i:2;s:12:\\"student.user\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"bcbd907e-6e32-4946-86f1-5fd4f6381fe5\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '0dabcd37-41e6-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-29 20:51:05
9	e690b9b6-e85f-41e2-88df-405f5a3cb2bc	redis	default	{"uuid":"e690b9b6-e85f-41e2-88df-405f5a3cb2bc","timeout":null,"id":"woFZd62MU33CEnMGcEtkukq1G5dKiuZE","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:29;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:13;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"4c5dd95a-8852-4334-8c24-32d4a3993c7e\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '5f6bd74b-4b26-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-05-31 18:26:12
10	03ae2693-a6bd-4e21-8e9f-65fd4a73eaba	redis	default	{"uuid":"03ae2693-a6bd-4e21-8e9f-65fd4a73eaba","timeout":null,"id":"Zo6PdvsZAdOpTm7cd1FLjhGqbJoURt8i","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:32;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:16;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"081c6ee8-ff11-4d1c-9926-aa7349934afa\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '978c8d80-c625-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 09:16:58
11	6f7b1827-9543-4beb-9bc2-edf6fdee3737	redis	default	{"uuid":"6f7b1827-9543-4beb-9bc2-edf6fdee3737","timeout":null,"id":"ZGDxzDp1qkkuKLpqTD69JBGc4DxI8IRm","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:32;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:17;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"e4c09712-c324-4995-aac8-e31d0ec46315\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '8850b9e2-06e1-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 09:23:55
12	a0b67636-24fd-4368-9d32-babe30ece494	redis	default	{"uuid":"a0b67636-24fd-4368-9d32-babe30ece494","timeout":null,"id":"0fajCUAHqlCMUxKT3JzZQxYueESqXob6","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:33;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:18;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"17f9b05e-ba21-49cc-b4d1-a6b85fe0920e\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), 'f3467bcd-d0a3-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 09:42:24
13	cd255b2d-341c-4f91-9dc3-248c1fcdf49d	redis	default	{"uuid":"cd255b2d-341c-4f91-9dc3-248c1fcdf49d","timeout":null,"id":"JxRjSzg7OsFaxXcqI7e5k9wkKBW1sCx6","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:33;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:21;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"3b1f2b22-2b1e-4617-9086-cb65b7176a94\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), 'a2e6bd7f-e556-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 09:50:04
14	779fb7fa-6aa9-4455-9bba-5fabf4011c95	redis	default	{"uuid":"779fb7fa-6aa9-4455-9bba-5fabf4011c95","timeout":null,"id":"vrEKZgkj1N5zzUf3tF1lkxxbCcCGvL9z","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:34;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:25;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"d81200ed-4863-4d3f-bcfa-d1d9a4636855\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '72683ca9-263c-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 10:15:40
15	6592691b-9162-4e9f-919a-d84fc8a81363	redis	default	{"uuid":"6592691b-9162-4e9f-919a-d84fc8a81363","timeout":null,"id":"zYXjs8guzhiISfMYbcN5Swn2dT1yEVGS","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:34;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:26;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"b115b501-ba28-4fc7-a2b0-556ebf3f77a9\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '75d06090-9e2f-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 10:16:55
16	9ce3dd78-ed59-446a-8fc5-20ea3fb625c1	redis	default	{"uuid":"9ce3dd78-ed59-446a-8fc5-20ea3fb625c1","timeout":null,"id":"u2kHgC0XW9RpDPBshYrvgvHCNmIPFeA8","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:34;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:27;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"bf6a23a1-4c29-48d1-9217-79d1d1179e39\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), 'a17cfaeb-4b22-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 10:23:36
17	20141629-57db-4577-90e1-c52249598c95	redis	default	{"uuid":"20141629-57db-4577-90e1-c52249598c95","timeout":null,"id":"83ySxqnQktX3SOCAD2aX3Yr9oeBLCHxF","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:34;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:28;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"afd8dc8a-7cc0-4148-91bc-f0cfcad7572f\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '9e6f9a31-6f04-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 10:24:15
18	9f0a26bd-5eac-40cd-b54a-0121789ac0ef	redis	default	{"uuid":"9f0a26bd-5eac-40cd-b54a-0121789ac0ef","timeout":null,"id":"DHNnm36qfYBRasvzxOZNA73rBYqilLhC","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:34;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:29;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"13123366-0a10-4ca1-8391-fdc477835679\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), 'cddf2266-8840-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 10:25:49
19	9c025a6d-4e90-4649-b186-c3ea16a87831	redis	default	{"uuid":"9c025a6d-4e90-4649-b186-c3ea16a87831","timeout":null,"id":"zmJdRvdFUYwXpXErzmZYklOa8Ba43hIm","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:34;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:30;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"160e138c-3270-4dcd-bd27-8da14212e92c\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '3bcde6f3-453f-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-01 10:28:19
20	f2f580cb-2a83-434b-a27d-640c010f0ee5	redis	default	{"uuid":"f2f580cb-2a83-434b-a27d-640c010f0ee5","timeout":null,"id":"wqWwNdBCzFgh5qawTIMem1Dkie5JUXJv","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:39;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:32;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"9df703ba-6618-4416-9609-45f6de54d1d4\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '359438c5-a42b-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-10 16:16:27
21	8878a82c-2627-4d96-965a-693807ce4cbd	redis	default	{"uuid":"8878a82c-2627-4d96-965a-693807ce4cbd","timeout":null,"id":"c93aOlUJiGeGI3rLcMpRkT8IZNaN7g7E","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:39;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:33;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"4cb0d655-f96c-47dc-992c-fbb6c7445f0f\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '0dd5adbf-d8df-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-12 12:50:31
22	56d89578-bc8c-46e1-8d68-18c421a2fde3	redis	default	{"uuid":"56d89578-bc8c-46e1-8d68-18c421a2fde3","timeout":null,"id":"wfgTp9chaF9lvISxOXqA99miiYXkMpUn","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:29;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:34;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"1de733f8-c9c8-4157-b524-2347f7c7c1dc\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), 'a0e79284-9cc4-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-13 18:29:40
23	0fada8d3-2b36-4a87-95b7-08fc9f8d3b52	redis	default	{"uuid":"0fada8d3-2b36-4a87-95b7-08fc9f8d3b52","timeout":null,"id":"3SJpc15TWPklcYBWp7A0wsK7L1Pc6Chq","backoff":null,"displayName":"App\\\\Notifications\\\\SubscriptionActivated","maxTries":null,"failOnTimeout":false,"maxExceptions":null,"retryUntil":null,"job":"Illuminate\\\\Queue\\\\CallQueuedHandler@call","data":{"command":"O:48:\\"Illuminate\\\\Notifications\\\\SendQueuedNotifications\\":3:{s:11:\\"notifiables\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:15:\\"App\\\\Models\\\\User\\";s:2:\\"id\\";a:1:{i:0;i:39;}s:9:\\"relations\\";a:0:{}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:12:\\"notification\\";O:39:\\"App\\\\Notifications\\\\SubscriptionActivated\\":2:{s:12:\\"subscription\\";O:45:\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\":5:{s:5:\\"class\\";s:23:\\"App\\\\Models\\\\Subscription\\";s:2:\\"id\\";i:35;s:9:\\"relations\\";a:3:{i:0;s:7:\\"student\\";i:1;s:12:\\"student.user\\";i:2;s:12:\\"student.lead\\";}s:10:\\"connection\\";s:5:\\"pgsql\\";s:15:\\"collectionClass\\";N;}s:2:\\"id\\";s:36:\\"4ef350f0-8efd-4f8d-bae0-e3464ceac338\\";}s:8:\\"channels\\";a:1:{i:0;s:8:\\"database\\";}}","commandName":"Illuminate\\\\Notifications\\\\SendQueuedNotifications"},"attempts":2}	ErrorException: Attempt to read property "name" on null in /var/www/backend/app/Notifications/SubscriptionActivated.php:26\nStack trace:\n#0 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Bootstrap/HandleExceptions.php(258): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->handleError(2, 'Attempt to read...', '/var/www/backen...', 26)\n#1 /var/www/backend/app/Notifications/SubscriptionActivated.php(26): Illuminate\\Foundation\\Bootstrap\\HandleExceptions->Illuminate\\Foundation\\Bootstrap\\{closure}(2, 'Attempt to read...', '/var/www/backen...', 26)\n#2 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(57): App\\Notifications\\SubscriptionActivated->toDatabase(Object(App\\Models\\User))\n#3 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(38): Illuminate\\Notifications\\Channels\\DatabaseChannel->getData(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#4 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/Channels/DatabaseChannel.php(20): Illuminate\\Notifications\\Channels\\DatabaseChannel->buildPayload(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#5 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(148): Illuminate\\Notifications\\Channels\\DatabaseChannel->send(Object(App\\Models\\User), Object(App\\Notifications\\SubscriptionActivated))\n#6 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(106): Illuminate\\Notifications\\NotificationSender->sendToNotifiable(Object(App\\Models\\User), '3d98dced-4f14-4...', Object(App\\Notifications\\SubscriptionActivated), 'database')\n#7 /var/www/backend/vendor/laravel/framework/src/Illuminate/Support/Traits/Localizable.php(19): Illuminate\\Notifications\\NotificationSender->Illuminate\\Notifications\\{closure}()\n#8 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/NotificationSender.php(101): Illuminate\\Notifications\\NotificationSender->withLocale(NULL, Object(Closure))\n#9 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/ChannelManager.php(54): Illuminate\\Notifications\\NotificationSender->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#10 /var/www/backend/vendor/laravel/framework/src/Illuminate/Notifications/SendQueuedNotifications.php(119): Illuminate\\Notifications\\ChannelManager->sendNow(Object(Illuminate\\Database\\Eloquent\\Collection), Object(App\\Notifications\\SubscriptionActivated), Array)\n#11 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Notifications\\SendQueuedNotifications->handle(Object(Illuminate\\Notifications\\ChannelManager))\n#12 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#13 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#14 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#15 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#16 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(126): Illuminate\\Container\\Container->call(Array)\n#17 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#18 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#19 /var/www/backend/vendor/laravel/framework/src/Illuminate/Bus/Dispatcher.php(130): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#20 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(126): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Notifications\\SendQueuedNotifications), false)\n#21 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(170): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#22 /var/www/backend/vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php(127): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#23 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(121): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#24 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/CallQueuedHandler.php(69): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Notifications\\SendQueuedNotifications))\n#25 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Jobs/Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\RedisJob), Array)\n#26 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(442): Illuminate\\Queue\\Jobs\\Job->fire()\n#27 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(392): Illuminate\\Queue\\Worker->process('redis', Object(Illuminate\\Queue\\Jobs\\RedisJob), Object(Illuminate\\Queue\\WorkerOptions))\n#28 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Worker.php(178): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\RedisJob), 'redis', Object(Illuminate\\Queue\\WorkerOptions))\n#29 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(149): Illuminate\\Queue\\Worker->daemon('redis', 'default', Object(Illuminate\\Queue\\WorkerOptions))\n#30 /var/www/backend/vendor/laravel/framework/src/Illuminate/Queue/Console/WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker('redis', 'default')\n#31 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#32 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#33 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(95): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#34 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#35 /var/www/backend/vendor/laravel/framework/src/Illuminate/Container/Container.php(696): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#36 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(213): Illuminate\\Container\\Container->call(Array)\n#37 /var/www/backend/vendor/symfony/console/Command/Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#38 /var/www/backend/vendor/laravel/framework/src/Illuminate/Console/Command.php(182): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#39 /var/www/backend/vendor/symfony/console/Application.php(1117): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#40 /var/www/backend/vendor/symfony/console/Application.php(356): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#41 /var/www/backend/vendor/symfony/console/Application.php(195): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#42 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Console/Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#43 /var/www/backend/vendor/laravel/framework/src/Illuminate/Foundation/Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#44 /var/www/backend/artisan(13): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#45 {main}	2026-06-13 18:51:39
\.


--
-- Data for Name: group_class_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_class_registrations (id, group_class_id, student_id, registered_at, joined_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: group_classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_classes (id, teacher_id, title, description, lesson_id, scheduled_at, max_seats, registered_count, status, daily_room_name, daily_room_url, started_at, ended_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: lead_remarks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lead_remarks (id, lead_id, staff_id, content, created_at) FROM stdin;
42	48	1	تيست	2026-05-17 13:59:24
43	48	1	تيست	2026-05-17 14:07:01
44	48	1	يبيي	2026-05-17 14:07:07
45	48	1	تيست	2026-05-17 14:12:20
46	48	1	يذس	2026-05-17 14:12:25
49	14	1	تيست	2026-05-17 14:22:31
52	12	11	هاي لا تحطها سمول تراجيري	2026-05-18 10:55:41
54	50	11	لابتوب	2026-05-18 16:26:33
55	58	1	تجربة الحجز	2026-05-31 18:02:27
73	63	1	✅ تم الاشتراك — من درس #73 (درس 1 — Unit 1) إلى درس #96 (درس 12 — Unit 2) — 24 درس — 144.00 د.أ	2026-06-10 16:16:27
74	63	1	❌ تم إلغاء الاشتراك — السبب: ااننحمح	2026-06-10 20:04:40
77	62	35	📋 تقرير الحصة التقييمية\n━━━━━━━━━━━━━━━━━━━━\nمستوى الطالب: A1\n\nأسئلة التقييم بعد الحصة:\nبد\n\nسرعة الفهم / نقاط القوة:\nبل\n\nنقاط الضعف:\nبدددب\n\nملاحظات عامة:\nدقبلززز	2026-06-10 21:20:51
78	63	1	✅ تم الاشتراك — من درس #37 (Personal Info & Introductions) إلى درس #72 (General Review A2) — 36 درس — 216.00 د.أ	2026-06-12 12:50:28
79	48	1	❌ تم إلغاء الاشتراك — السبب: موم،،،	2026-06-12 13:25:18
80	58	1	❌ تم إلغاء الاشتراك — السبب: ااااااا	2026-06-13 18:26:11
81	58	1	✅ تم الاشتراك — من درس #1 (Foundations A-I) إلى درس #72 (General Review A2) — 72 درس — 432.00 د.أ	2026-06-13 18:29:39
82	63	1	❌ تم إلغاء الاشتراك — السبب: رررووو	2026-06-13 18:50:32
83	63	1	✅ تم الاشتراك — من درس #94 (درس 10 — Unit 2) إلى درس #96 (درس 12 — Unit 2) — 3 درس — 18.00 د.أ	2026-06-13 18:51:39
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, name, phone, source, age, status, assigned_to, is_small_treasure, moved_to_open_sea_at, converted_at, created_at, updated_at, deleted_at, first_assigned_to, scheduled_at) FROM stdin;
14	ws	0787621516	landing_page	\N	new	\N	f	\N	\N	2026-05-15 00:05:11	2026-05-20 00:59:12	\N	\N	\N
50	عمر	٠٧٨٧٦٢١٣١٤	حلاق	8	subscriber	\N	f	\N	2026-05-20 01:03:54	2026-05-18 13:13:31	2026-05-20 01:03:54	\N	\N	\N
12	عبد الرحمن	0787621713	landing_page	10	new	\N	f	\N	2026-05-20 00:38:52	2026-05-13 18:55:42	2026-05-20 01:04:40	\N	11	\N
49	عصام	٠٧٨٧٦٢١٤٣٥	حلاق	9	subscriber	\N	f	\N	2026-05-20 02:24:04	2026-05-17 15:15:50	2026-05-20 02:24:04	\N	\N	\N
52	عبد الله	0787621799	\N	\N	new	\N	f	\N	\N	2026-05-24 20:35:51	2026-05-24 20:35:51	\N	\N	\N
55	طالب تجريبي	00962799999999	app_eval	\N	new	\N	f	\N	\N	2026-05-29 19:21:00	2026-05-29 19:21:00	\N	\N	\N
51	عصام احمة	٠٧٨٧٦٢١٤٣٩	\N	8	new	\N	f	\N	\N	2026-05-18 15:36:11	2026-05-20 00:59:07	\N	\N	\N
62	me	0787621715	\N	\N	new	\N	f	\N	\N	2026-06-09 13:37:41	2026-06-11 12:52:52	\N	\N	2026-06-11 13:00:00
48	ا	٠٧٨٧٦٢١١١١	\N	\N	postponed	\N	f	\N	2026-05-20 00:30:32	2026-05-16 18:50:23	2026-06-12 13:26:01	\N	\N	\N
13	يي	078762177	landing_page	\N	open_sea	\N	f	2026-06-12 13:26:32	\N	2026-05-13 18:57:08	2026-06-12 13:26:32	\N	\N	\N
11	١٢٣	0787621717	landing_page	\N	open_sea	\N	f	2026-06-12 13:26:32	\N	2026-05-13 18:19:01	2026-06-12 13:26:32	\N	\N	\N
58	مؤ	0782911521	app_eval	\N	subscriber	\N	f	\N	2026-06-13 18:29:39	2026-05-31 17:04:15	2026-06-13 18:29:39	\N	\N	2026-06-01 09:00:00
63	انا	+962787621715	app_assessment	\N	subscriber	\N	f	\N	2026-06-13 18:51:39	2026-06-10 15:56:39	2026-06-13 18:51:39	\N	\N	2026-06-10 16:00:00
\.


--
-- Data for Name: lesson_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lesson_bookings (id, student_id, level_code, lesson_number, scheduled_at, teacher_id, teacher_code, session_url, status, quiz_locked, quiz_attempts, quiz_score, quiz_passed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lessons (id, level_id, unit_id, title, description, "order", nearpod_lesson_id, nearpod_url, is_active, created_at, updated_at, is_assessment, pdf_url, activity_url) FROM stdin;
68	2	6	Reading Mastery	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-68.pdf	\N
73	3	7	درس 1 — Unit 1	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/611/929
97	3	9	درس 1 — Unit 3	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
98	3	9	درس 2 — Unit 3	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
99	3	9	درس 3 — Unit 3	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
100	3	9	درس 4 — Unit 3	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
101	3	9	درس 5 — Unit 3	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
102	3	9	درس 6 — Unit 3	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
103	3	9	درس 7 — Unit 3	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
104	3	9	درس 8 — Unit 3	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
105	3	9	درس 9 — Unit 3	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
106	3	9	درس 10 — Unit 3	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
107	3	9	درس 11 — Unit 3	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
108	3	9	درس 12 — Unit 3	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
109	3	10	درس 1 — Unit 4	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
110	3	10	درس 2 — Unit 4	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
111	3	10	درس 3 — Unit 4	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
112	3	10	درس 4 — Unit 4	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
113	3	10	درس 5 — Unit 4	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
114	3	10	درس 6 — Unit 4	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
115	3	10	درس 7 — Unit 4	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
116	3	10	درس 8 — Unit 4	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
117	3	10	درس 9 — Unit 4	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
118	3	10	درس 10 — Unit 4	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
119	3	10	درس 11 — Unit 4	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
120	3	10	درس 12 — Unit 4	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
121	3	11	درس 1 — Unit 5	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
122	3	11	درس 2 — Unit 5	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
123	3	11	درس 3 — Unit 5	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
124	3	11	درس 4 — Unit 5	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
125	3	11	درس 5 — Unit 5	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
126	3	11	درس 6 — Unit 5	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
127	3	11	درس 7 — Unit 5	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
128	3	11	درس 8 — Unit 5	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
129	3	11	درس 9 — Unit 5	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
130	3	11	درس 10 — Unit 5	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	\N
131	3	11	درس 11 — Unit 5	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
132	3	11	درس 12 — Unit 5	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
133	4	12	درس 1 — Unit 1	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
134	4	12	درس 2 — Unit 1	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
135	4	12	درس 3 — Unit 1	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
136	4	12	درس 4 — Unit 1	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
137	4	12	درس 5 — Unit 1	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
138	4	12	درس 6 — Unit 1	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
139	4	12	درس 7 — Unit 1	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
140	4	12	درس 8 — Unit 1	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
141	4	12	درس 9 — Unit 1	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
142	4	12	درس 10 — Unit 1	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
143	4	12	درس 11 — Unit 1	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
144	4	12	درس 12 — Unit 1	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
145	4	13	درس 1 — Unit 2	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
146	4	13	درس 2 — Unit 2	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
147	4	13	درس 3 — Unit 2	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
148	4	13	درس 4 — Unit 2	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
149	4	13	درس 5 — Unit 2	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
150	4	13	درس 6 — Unit 2	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
151	4	13	درس 7 — Unit 2	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
152	4	13	درس 8 — Unit 2	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
153	4	13	درس 9 — Unit 2	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
154	4	13	درس 10 — Unit 2	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
155	4	13	درس 11 — Unit 2	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
156	4	13	درس 12 — Unit 2	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
157	4	14	درس 1 — Unit 3	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
158	4	14	درس 2 — Unit 3	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
159	4	14	درس 3 — Unit 3	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
160	4	14	درس 4 — Unit 3	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
161	4	14	درس 5 — Unit 3	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
162	4	14	درس 6 — Unit 3	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
163	4	14	درس 7 — Unit 3	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
164	4	14	درس 8 — Unit 3	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
165	4	14	درس 9 — Unit 3	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
166	4	14	درس 10 — Unit 3	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
167	4	14	درس 11 — Unit 3	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
168	4	14	درس 12 — Unit 3	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
169	4	15	درس 1 — Unit 4	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
170	4	15	درس 2 — Unit 4	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
171	4	15	درس 3 — Unit 4	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
172	4	15	درس 4 — Unit 4	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
173	4	15	درس 5 — Unit 4	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
174	4	15	درس 6 — Unit 4	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
175	4	15	درس 7 — Unit 4	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
176	4	15	درس 8 — Unit 4	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
177	4	15	درس 9 — Unit 4	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
178	4	15	درس 10 — Unit 4	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
179	4	15	درس 11 — Unit 4	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
180	4	15	درس 12 — Unit 4	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
181	4	16	درس 1 — Unit 5	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
182	4	16	درس 2 — Unit 5	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
183	4	16	درس 3 — Unit 5	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
184	4	16	درس 4 — Unit 5	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
185	4	16	درس 5 — Unit 5	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
186	4	16	درس 6 — Unit 5	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
187	4	16	درس 7 — Unit 5	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
188	4	16	درس 8 — Unit 5	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
189	4	16	درس 9 — Unit 5	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
190	4	16	درس 10 — Unit 5	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
191	4	16	درس 11 — Unit 5	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
192	4	16	درس 12 — Unit 5	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
193	5	17	درس 1 — Unit 1	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
194	5	17	درس 2 — Unit 1	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
195	5	17	درس 3 — Unit 1	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
196	5	17	درس 4 — Unit 1	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
197	5	17	درس 5 — Unit 1	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
198	5	17	درس 6 — Unit 1	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
199	5	17	درس 7 — Unit 1	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
200	5	17	درس 8 — Unit 1	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
201	5	17	درس 9 — Unit 1	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
202	5	17	درس 10 — Unit 1	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
203	5	17	درس 11 — Unit 1	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
204	5	17	درس 12 — Unit 1	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
205	5	18	درس 1 — Unit 2	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
206	5	18	درس 2 — Unit 2	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
207	5	18	درس 3 — Unit 2	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
208	5	18	درس 4 — Unit 2	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
209	5	18	درس 5 — Unit 2	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
210	5	18	درس 6 — Unit 2	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
211	5	18	درس 7 — Unit 2	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
212	5	18	درس 8 — Unit 2	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
213	5	18	درس 9 — Unit 2	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
214	5	18	درس 10 — Unit 2	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
215	5	18	درس 11 — Unit 2	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
216	5	18	درس 12 — Unit 2	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
217	5	19	درس 1 — Unit 3	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
218	5	19	درس 2 — Unit 3	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
219	5	19	درس 3 — Unit 3	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
220	5	19	درس 4 — Unit 3	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
221	5	19	درس 5 — Unit 3	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
222	5	19	درس 6 — Unit 3	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
223	5	19	درس 7 — Unit 3	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
224	5	19	درس 8 — Unit 3	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
225	5	19	درس 9 — Unit 3	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
226	5	19	درس 10 — Unit 3	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
227	5	19	درس 11 — Unit 3	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
228	5	19	درس 12 — Unit 3	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
229	5	20	درس 1 — Unit 4	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
230	5	20	درس 2 — Unit 4	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
231	5	20	درس 3 — Unit 4	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
232	5	20	درس 4 — Unit 4	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
233	5	20	درس 5 — Unit 4	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
234	5	20	درس 6 — Unit 4	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
235	5	20	درس 7 — Unit 4	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
236	5	20	درس 8 — Unit 4	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
237	5	20	درس 9 — Unit 4	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
238	5	20	درس 10 — Unit 4	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
239	5	20	درس 11 — Unit 4	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
240	5	20	درس 12 — Unit 4	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
241	5	21	درس 1 — Unit 5	\N	1	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
242	5	21	درس 2 — Unit 5	\N	2	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
243	5	21	درس 3 — Unit 5	\N	3	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
244	5	21	درس 4 — Unit 5	\N	4	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
245	5	21	درس 5 — Unit 5	\N	5	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
246	5	21	درس 6 — Unit 5	\N	6	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
247	5	21	درس 7 — Unit 5	\N	7	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
248	5	21	درس 8 — Unit 5	\N	8	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
249	5	21	درس 9 — Unit 5	\N	9	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
250	5	21	درس 10 — Unit 5	\N	10	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
251	5	21	درس 11 — Unit 5	\N	11	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
252	5	21	درس 12 — Unit 5	\N	12	\N	\N	t	2026-05-09 13:30:58	2026-05-09 13:30:58	f	\N	\N
74	3	7	درس 2 — Unit 1	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/653/122
1	1	1	Foundations A-I	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-1.pdf	\N
2	1	1	Completing the Alphabet & Vowels	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-2.pdf	\N
3	1	1	Numbers Adventure	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-3.pdf	\N
35	1	3	Reading Mastery	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:36:20	f	http://localhost:8000/storage/lessons/lesson-a1-35.pdf	\N
75	3	7	درس 3 — Unit 1	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/683/343
76	3	7	درس 4 — Unit 1	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/742/645
254	2	\N	Making an Order	حصة تقييمية لقياس مستوى الطالب قبل الاشتراك في مستوى مرحلة البناء التأسيسي المتقدم	0	\N	\N	t	2026-05-09 15:52:24	2026-06-01 08:36:56	t	http://localhost:8000/storage/lessons/assessment-2.pdf	https://wordwall.net/play/114276/145/316
253	1	\N	Greetings — Beginner	حصة تقييمية لقياس مستوى الطالب قبل الاشتراك في مستوى مرحلة التأسيس	0	\N	https://nearpod.com/t/eval-b1-abc	t	2026-05-09 15:52:24	2026-06-01 08:36:56	t	http://localhost:8000/storage/lessons/assessment-1.pdf	https://wordwall.net/play/114276/017/809
255	3	\N	WH Questions	حصة تقييمية لقياس مستوى الطالب قبل الاشتراك في مستوى مرحلة الفهم والثقة	0	\N	\N	t	2026-05-09 15:52:24	2026-06-01 08:36:56	t	http://localhost:8000/storage/lessons/assessment-3.pdf	https://wordwall.net/play/114276/679/142
77	3	7	درس 5 — Unit 1	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/774/562
78	3	7	درس 6 — Unit 1	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/820/472
79	3	7	درس 7 — Unit 1	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/868/161
80	3	7	درس 8 — Unit 1	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/897/847
5	1	1	Colors	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-5.pdf	https://wordwall.net/play/114245/231/290
6	1	1	Superhero Mission	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-6.pdf	https://wordwall.net/play/114244/995/683
8	1	1	Parts of the Body	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-8.pdf	https://wordwall.net/play/114245/573/999
9	1	1	Final Review & Test	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-9.pdf	https://wordwall.net/play/114245/045/605
12	1	1	Countries & Nationalities	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-12.pdf	https://wordwall.net/play/114382/898/944
13	1	2	Review Session	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-13.pdf	https://wordwall.net/play/114383/242/229
14	1	2	Jobs & Numbers	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-14.pdf	https://wordwall.net/play/114384/192/642
15	1	2	My Wonderful Family	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-15.pdf	https://wordwall.net/play/114384/676/463
16	1	2	Describing People	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-16.pdf	https://wordwall.net/play/114384/843/207
19	1	2	Food, Drinks & Likes	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-19.pdf	https://wordwall.net/play/114387/575/679
20	1	2	iFluent Reading Club	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-20.pdf	https://wordwall.net/play/114387/858/230
22	1	2	The Big Review Challenge	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-22.pdf	https://wordwall.net/play/114388/437/525
23	1	2	My Daily Routine	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-23.pdf	https://wordwall.net/play/114389/056/491
26	1	3	Routine Mastery	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-26.pdf	https://wordwall.net/resource/114389162
27	1	3	My Sweet Home	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-27.pdf	https://wordwall.net/play/114389/248/956
29	1	3	Reading Club 2	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-29.pdf	https://wordwall.net/resource/114392345
30	1	3	Can I Order, Please?	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-30.pdf	https://wordwall.net/play/114392/345/120
33	1	3	Scene Investigator	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-33.pdf	https://wordwall.net/play/114393/355/623
34	1	3	The Past Adventure	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-34.pdf	https://wordwall.net/resource/114393599
36	1	3	Review Session	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-36.pdf	https://wordwall.net/play/114428/957/679
38	2	4	Descriptions & Personality	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-38.pdf	https://wordwall.net/play/114435/464/456
39	2	4	Family & Relationships	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-39.pdf	https://wordwall.net/play/114435/592/242
41	2	4	Daily Routines & Time Expressions	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-41.pdf	https://wordwall.net/play/114436/707/517
43	2	4	Hobbies	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-43.pdf	https://wordwall.net/play/114437/552/388
45	2	4	Conjunctions	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-45.pdf	https://wordwall.net/play/114460/871/906
46	2	4	Review 1–9	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-46.pdf	https://wordwall.net/play/114461/028/399
48	2	4	Place Description	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-48.pdf	https://wordwall.net/play/114462/050/632
11	1	1	Numbers and Things	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-11.pdf	https://wordwall.net/play/114382/673/520
49	2	5	My Home	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-49.pdf	https://wordwall.net/play/114462/327/949
50	2	5	My Home 2	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-50.pdf	https://wordwall.net/play/114462/510/800
52	2	5	Polite Requests	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-52.pdf	https://wordwall.net/play/114462/703/678
54	2	5	Quantifiers — Some, Any, Much, Many	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-54.pdf	https://wordwall.net/play/114463/051/328
55	2	5	Review 11–18	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-55.pdf	https://wordwall.net/play/114463/132/408
57	2	5	Irregular Past Verbs	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-57.pdf	https://wordwall.net/play/114463/165/400
58	2	5	Past Experiences	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-58.pdf	https://wordwall.net/play/114463/262/621
60	2	5	Review 20–24	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-60.pdf	https://wordwall.net/play/114463/431/859
61	2	6	Talking About the Future	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-61.pdf	https://wordwall.net/play/114463/454/941
64	2	6	Making Suggestions	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-64.pdf	https://wordwall.net/play/114464/073/639
65	2	6	Directions	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-65.pdf	https://wordwall.net/play/114464/099/715
67	2	6	Ordering Food	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-67.pdf	https://wordwall.net/play/114464/335/201
70	2	6	Talking About the Weather	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-70.pdf	https://wordwall.net/play/114464/449/290
71	2	6	School Subjects	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-71.pdf	https://wordwall.net/play/114464/476/229
81	3	7	درس 9 — Unit 1	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/923/616
82	3	7	درس 10 — Unit 1	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114634/940/234
83	3	7	درس 11 — Unit 1	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/024/488
84	3	7	درس 12 — Unit 1	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/060/517
85	3	8	درس 1 — Unit 2	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/083/220
86	3	8	درس 2 — Unit 2	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/115/776
87	3	8	درس 3 — Unit 2	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/266/289
88	3	8	درس 4 — Unit 2	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/378/935
89	3	8	درس 5 — Unit 2	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/426/302
90	3	8	درس 6 — Unit 2	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/453/301
91	3	8	درس 7 — Unit 2	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/498/505
92	3	8	درس 8 — Unit 2	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/536/562
93	3	8	درس 9 — Unit 2	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/552/551
94	3	8	درس 10 — Unit 2	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/572/248
95	3	8	درس 11 — Unit 2	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/598/881
96	3	8	درس 12 — Unit 2	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-09 13:30:57	f	\N	https://wordwall.net/play/114635/623/763
37	2	4	Personal Info & Introductions	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-37.pdf	https://wordwall.net/play/114434/772/949
4	1	1	Digraphs	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-4.pdf	https://wordwall.net/play/114825/724/328
7	1	1	Greetings	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-30 13:07:29	f	http://localhost:8000/storage/lessons/lesson-a1-7.pdf	https://wordwall.net/play/114245/547/602
40	2	4	Jobs	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-40.pdf	https://wordwall.net/play/114435/839/227
42	2	4	Present Simple — Negative & Questions	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-42.pdf	https://wordwall.net/play/114437/191/401
44	2	4	Expressing Habits with Verb+ing	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-44.pdf	https://wordwall.net/play/114437/811/100
47	2	4	Descriptive Prepositions of Place	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-47.pdf	https://wordwall.net/play/114461/666/913
10	1	1	Nice to Meet You	\N	10	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-10.pdf	https://wordwall.net/play/114381/864/486
17	1	2	Review 2: The Superstar	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-17.pdf	https://wordwall.net/play/114384/964/216
18	1	2	What's in Your Bag?	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-18.pdf	https://wordwall.net/play/114385/452/990
21	1	2	Time & Days	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-21.pdf	https://wordwall.net/play/114388/128/642
24	1	2	His & Her Routine	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-24.pdf	https://wordwall.net/play/114388/437/126
25	1	3	How Often? My Schedule	\N	1	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-25.pdf	https://wordwall.net/play/114389/056/137
28	1	3	Where is My House?	\N	4	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-28.pdf	https://wordwall.net/resource/114392125
31	1	3	Master Review 4	\N	7	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-31.pdf	https://wordwall.net/play/114392/702/395
32	1	3	Action Report	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-30 22:33:40	f	http://localhost:8000/storage/lessons/lesson-a1-32.pdf	https://wordwall.net/play/114393/189/652
51	2	5	Life Skills & Daily Scenarios	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-51.pdf	https://wordwall.net/play/114462/577/137
53	2	5	Countable vs Uncountable Nouns	\N	5	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-53.pdf	https://wordwall.net/play/114462/879/709
56	2	5	Past Simple	\N	8	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-56.pdf	https://wordwall.net/resource/114463200
59	2	5	WH Questions	\N	11	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-59.pdf	https://wordwall.net/play/114463/329/216
62	2	6	Yesterday and Tomorrow	\N	2	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-62.pdf	https://wordwall.net/play/114463/520/478
63	2	6	Review — Past & Future	\N	3	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-63.pdf	https://wordwall.net/play/114464/042/879
66	2	6	In the City	\N	6	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-66.pdf	https://wordwall.net/play/114464/183/632
69	2	6	Polite Agreement	\N	9	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-69.pdf	https://wordwall.net/play/114464/382/405
72	2	6	General Review A2	\N	12	\N	\N	t	2026-05-09 13:30:57	2026-05-31 22:57:31	f	http://localhost:8000/storage/lessons/lesson-a2-72.pdf	https://wordwall.net/play/114464/500/725
\.


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.levels (id, code, name, name_en, description, "order", total_units, total_lessons, is_active, created_at, updated_at) FROM stdin;
1	A1	مرحلة التأسيس	Foundation	مرحلة البداية لتعلم اللغة الإنجليزية من الصفر.	1	3	36	t	2026-05-09 13:30:57	2026-05-09 13:30:57
2	A2	مرحلة البناء التأسيسي المتقدم	Advanced Foundation	توسيع المفردات وتعزيز القواعد الأساسية.	2	3	36	t	2026-05-09 13:30:57	2026-05-09 13:30:57
3	B1	مرحلة الفهم والثقة	Understanding & Confidence	بناء الثقة في الاستخدام اليومي للغة.	3	5	60	t	2026-05-09 13:30:57	2026-05-09 13:30:57
4	B2	مرحلة الطلاقة والتوسع	Fluency & Expansion	تطوير الطلاقة والتعبير الأكاديمي والمهني.	4	5	60	t	2026-05-09 13:30:58	2026-05-09 13:30:58
5	FT	الإتقان اللغوي والمحادثة الحرة	Free Talking & Mastery	المحادثة الحرة والإتقان الكامل للغة.	5	5	60	t	2026-05-09 13:30:58	2026-05-09 13:30:58
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2026_05_06_235753_create_personal_access_tokens_table	1
5	2026_05_06_235822_create_packages_table	1
6	2026_05_06_235823_create_leads_table	1
7	2026_05_06_235824_create_students_table	1
8	2026_05_06_235826_create_subscriptions_table	1
9	2026_05_07_004036_create_lead_remarks_table	1
10	2026_05_07_004329_create_otp_codes_table	2
11	2026_05_07_102447_create_teachers_table	3
12	2026_05_07_102620_create_notifications_table	4
13	2026_05_09_000001_create_levels_table	5
14	2026_05_09_000002_create_units_table	5
15	2026_05_09_000003_create_lessons_table	5
16	2026_05_09_000004_create_sessions_table	6
17	2026_05_09_000005_create_student_units_table	6
20	2026_05_09_000006_add_assessment_to_lessons_table	7
21	2026_05_09_000007_create_quizzes_table	8
22	2026_05_09_000008_create_quiz_questions_table	9
23	2026_05_09_000009_create_student_progress_table	10
24	2026_05_09_000010_create_session_requests_table	11
25	2026_05_09_000011_create_teacher_earnings_table	12
26	2026_05_09_000012_add_questions_per_attempt_to_quizzes_table	13
27	2026_05_09_000013_create_quiz_attempts_table	14
28	2026_05_09_000014_add_participant_tracking_to_sessions_table	15
29	2026_05_09_000015_create_teacher_availability_table	16
30	2026_05_09_000016_create_session_ratings_table	17
31	2026_05_09_000017_create_group_classes_table	18
32	2026_05_09_000018_create_group_class_registrations_table	19
33	2026_05_09_000020_create_site_settings_table	20
34	2026_05_09_000021_create_notebook_entries_table	21
35	2026_05_09_000019_add_fcm_token_to_users_table	22
37	2026_05_12_000100_update_hero_cta_text_site_setting	23
38	2026_05_17_135102_update_leads_status_enum	24
39	2026_05_18_000001_add_sessions_count_reset_at_to_teachers	25
40	2026_05_20_000001_create_payment_accounts_table	26
41	2026_05_20_000002_add_invoice_fields_to_subscriptions_table	26
42	2026_05_20_000003_add_price_per_month_setting	26
43	2026_05_20_000004_add_first_assigned_to_leads_table	27
44	2026_05_20_000005_add_lessons_count_to_subscriptions_table	28
45	2026_05_25_000001_add_category_to_notebook_entries_table	29
46	2026_05_26_000001_create_admin_messages_tables	30
47	2026_05_26_100001_add_lesson_credits_to_users_table	31
48	2026_05_26_100002_create_student_curriculum_assignments_table	31
49	2026_05_26_100003_create_lesson_bookings_table	31
50	2026_05_26_100004_create_curriculum_pdfs_table	31
51	2026_05_29_000001_add_scheduled_at_to_leads_table	32
52	2026_05_29_000002_make_session_requests_requested_by_nullable	33
53	2026_05_29_000003_make_session_requests_student_id_nullable	34
54	2026_05_30_000001_add_pdf_url_to_lessons_table	35
55	2026_05_31_000001_add_lesson_range_to_subscriptions_table	36
56	2026_05_31_000002_add_attendance_status_to_sessions_table	37
57	2026_06_07_181024_add_reset_fields_to_teachers_table	38
58	2026_06_09_000001_add_attendance_tracking_to_sessions_table	39
59	2026_06_10_000001_add_note_to_session_requests_table	40
60	2026_06_10_000002_add_evaluation_submitted_at_to_sessions_table	41
61	2026_06_11_000001_add_activity_url_to_lessons_table	42
62	2026_06_11_000003_add_reminder_sent_at_to_sessions_table	43
\.


--
-- Data for Name: notebook_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notebook_entries (id, student_id, title, content, lesson_id, is_pinned, created_at, updated_at, deleted_at, category) FROM stdin;
7	29	\N	ورر	\N	f	2026-06-09 21:50:38	2026-06-09 21:50:38	\N	general
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, type, notifiable_type, notifiable_id, data, read_at, created_at, updated_at) FROM stdin;
7af91981-53c5-4024-8f9a-d831808a0dd4	App\\Notifications\\SubscriptionActivated	App\\Models\\User	3	{"type":"subscription_activated","message":"\\u062a\\u0645 \\u062a\\u0641\\u0639\\u064a\\u0644 \\u0627\\u0634\\u062a\\u0631\\u0627\\u0643\\u0643 \\u0641\\u064a \\u062d\\u0632\\u0645\\u0629 Foundation Phase - \\u0645\\u0631\\u062d\\u0644\\u0629 \\u0627\\u0644\\u062a\\u0623\\u0633\\u064a\\u0633","package_id":1,"package_name":"Foundation Phase - \\u0645\\u0631\\u062d\\u0644\\u0629 \\u0627\\u0644\\u062a\\u0623\\u0633\\u064a\\u0633","activated_at":"2026-05-07T10:27:48+00:00"}	\N	2026-05-09 13:33:56	2026-05-09 13:33:56
be41fb31-3661-4a69-8019-045475074d64	App\\Notifications\\SubscriptionRejected	App\\Models\\User	1	{"type":"subscription_rejected","message":"\\u062a\\u0645 \\u0631\\u0641\\u0636 \\u0637\\u0644\\u0628 \\u0627\\u0644\\u0627\\u0634\\u062a\\u0631\\u0627\\u0643.","package_id":null,"reason":null}	\N	2026-05-31 18:09:45	2026-05-31 18:09:45
fe8813f0-c2dc-427e-8673-48aad9d3ca30	App\\Notifications\\SubscriptionRejected	App\\Models\\User	29	{"type":"subscription_rejected","message":"\\u062a\\u0645 \\u0631\\u0641\\u0636 \\u0637\\u0644\\u0628 \\u0627\\u0644\\u0627\\u0634\\u062a\\u0631\\u0627\\u0643.","package_id":null,"reason":null}	\N	2026-05-31 18:09:45	2026-05-31 18:09:45
fcd1d848-37df-4ac2-8803-e115dd822b9e	App\\Notifications\\SubscriptionRejected	App\\Models\\User	1	{"type":"subscription_rejected","message":"\\u062a\\u0645 \\u0631\\u0641\\u0636 \\u0637\\u0644\\u0628 \\u0627\\u0644\\u0627\\u0634\\u062a\\u0631\\u0627\\u0643.","package_id":null,"reason":null}	\N	2026-05-31 18:21:05	2026-05-31 18:21:05
0311df14-7e24-475a-9e6e-623efa0ad266	App\\Notifications\\SubscriptionRejected	App\\Models\\User	29	{"type":"subscription_rejected","message":"\\u062a\\u0645 \\u0631\\u0641\\u0636 \\u0637\\u0644\\u0628 \\u0627\\u0644\\u0627\\u0634\\u062a\\u0631\\u0627\\u0643.","package_id":null,"reason":null}	\N	2026-05-31 18:21:05	2026-05-31 18:21:05
1efecbcc-1813-40b4-8ef8-bc3168fb8348	App\\Notifications\\SubscriptionRejected	App\\Models\\User	1	{"type":"subscription_rejected","message":"\\u062a\\u0645 \\u0631\\u0641\\u0636 \\u0637\\u0644\\u0628 \\u0627\\u0644\\u0627\\u0634\\u062a\\u0631\\u0627\\u0643.","package_id":null,"reason":null}	\N	2026-05-31 18:22:20	2026-05-31 18:22:20
3c915da9-86e1-4459-908b-22cdffca5054	App\\Notifications\\SubscriptionRejected	App\\Models\\User	29	{"type":"subscription_rejected","message":"\\u062a\\u0645 \\u0631\\u0641\\u0636 \\u0637\\u0644\\u0628 \\u0627\\u0644\\u0627\\u0634\\u062a\\u0631\\u0627\\u0643.","package_id":null,"reason":null}	\N	2026-05-31 18:22:20	2026-05-31 18:22:20
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otp_codes (id, phone, code, expires_at, used_at, created_at) FROM stdin;
1	00962791234567	279456	2026-05-07 00:50:31	\N	2026-05-07 00:45:31
2	0791000001	182552	2026-05-09 13:38:40	\N	2026-05-09 13:33:40
3	0787621715	332323	2026-05-24 10:45:46	2026-05-24 10:44:02	2026-05-24 10:40:46
5	0787621712	111324	2026-05-24 10:49:14	\N	2026-05-24 10:44:14
6	0787652232	284399	2026-05-24 10:59:10	\N	2026-05-24 10:54:10
4	0787621715	758192	2026-05-24 10:49:02	2026-05-24 10:59:53	2026-05-24 10:44:02
7	0787621715	657054	2026-05-24 11:04:53	2026-06-09 11:51:47	2026-05-24 10:59:53
8	0787621715	379210	2026-06-09 11:56:47	\N	2026-06-09 11:51:47
\.


--
-- Data for Name: packages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.packages (id, name, description, levels_included, price, is_active, created_at, updated_at) FROM stdin;
1	Foundation Phase - مرحلة التأسيس	المرحلة الأولى في رحلة تعلم اللغة الإنجليزية	[1, 2]	150.00	t	2026-05-07 10:26:39	2026-05-07 10:26:39
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: payment_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_accounts (id, alias, cliq_name, sort_order, is_active, created_at, updated_at) FROM stdin;
1	iFluent26	محفظة أمنية يو واليت	1	t	2026-05-19 23:02:50	2026-05-19 23:02:50
2	IFLUENT3	بنك ريفلكت	2	t	2026-05-19 23:02:50	2026-05-19 23:02:50
3	IFLUENT	محفظة زين كاش	3	t	2026-05-19 23:02:50	2026-05-19 23:02:50
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
42	App\\Models\\User	2	t	8d2a8b7438ba9b63bcb38ab6138be13838f85c7d3bc5973bd11339e508ab7109	["student"]	\N	\N	2026-05-09 15:56:17	2026-05-09 15:56:17
259	App\\Models\\User	22	test	19216a1ed22b09b1d53919ffebff327ea7c77b8f55ab54e4b45bcc35268b4ced	["*"]	2026-06-07 18:56:31	\N	2026-06-07 18:56:30	2026-06-07 18:56:31
209	App\\Models\\User	32	student-session	ebdf2ba9a1c3944746b28f31ea6bc3a5fc85546f4c7c3844f44846a8f8b09970	["*"]	2026-06-01 09:24:53	\N	2026-06-01 09:20:53	2026-06-01 09:24:53
43	App\\Models\\User	10	crm-session	e8ce4d6a0cee0406ab58e5f25d86c73ace80341abc4fe5060dbf98b0b51030cf	["teacher"]	2026-05-09 15:56:53	\N	2026-05-09 15:56:52	2026-05-09 15:56:53
192	App\\Models\\User	26	student-session	233664a18d593762a993ea8f38a8f51e33970fd797fc78108c9a5c244b6dd6a5	["*"]	\N	\N	2026-05-31 16:52:04	2026-05-31 16:52:04
193	App\\Models\\User	27	student-session	e35441fffde2eb7cb423b0c82955c06c97c6cf71b0ca6140b5296371bb961ff8	["*"]	\N	\N	2026-05-31 16:52:47	2026-05-31 16:52:47
194	App\\Models\\User	28	student-session	524380148c4eea8e7b02c3f29db93215e905a2e26fdf190254eff094996724cc	["*"]	\N	\N	2026-05-31 16:54:45	2026-05-31 16:54:45
29	App\\Models\\User	4	crm-session	9fb09152269201b5ce7042bb9194807edc85f1481ebce743b3f669f00ae96bd5	["cc"]	2026-05-07 11:55:30	\N	2026-05-07 11:55:30	2026-05-07 11:55:30
265	App\\Models\\User	37	test	3b9fe2242c624b9c3ac7b54b09da6726189dabb9bebeaaf5754a799014710056	["*"]	\N	\N	2026-06-07 19:09:09	2026-06-07 19:09:09
14	App\\Models\\User	5	crm-session	189bda91d22b4788a08f22038fed378affcb4871d3b0c3a18aa83536f078b8fb	["ss"]	2026-05-07 10:58:27	\N	2026-05-07 10:58:27	2026-05-07 10:58:27
258	App\\Models\\User	22	test	6239ee238d90c7b262abc0faa3699a582eb4f79c77bb83e170ebc8fff5095da9	["*"]	2026-06-07 18:52:59	\N	2026-06-07 18:52:59	2026-06-07 18:52:59
349	App\\Models\\User	29	student-session	9603544073efc523f5e8a8b6f5dc6580da844aba8184b6b1ca8b24bdeb047873	["*"]	2026-06-13 19:26:15	\N	2026-06-13 18:53:07	2026-06-13 19:26:15
350	App\\Models\\User	38	teacher-session	d77701d759faf3a8be265fdeb8dc96787cb200c87381deccd90b2bc5842f73ec	["teacher"]	2026-06-13 19:07:39	\N	2026-06-13 18:56:57	2026-06-13 19:07:39
315	App\\Models\\User	41	teacher-session	c584f11a4f92c5639fca50045b5bca177636f3140fe272c172a8e074b6de9262	["teacher"]	2026-06-11 16:50:36	\N	2026-06-11 00:33:49	2026-06-11 16:50:36
286	App\\Models\\User	34	student-session	ba60624cd08394253f4deb043bf726c063e3c3f893dbcc802fc7003631d90956	["*"]	2026-06-09 09:03:22	\N	2026-06-08 23:12:02	2026-06-09 09:03:22
331	App\\Models\\User	1	crm-session	a34432f5008a21bf3ee6b2d85c711317941613fbf672e23f2b01fc7a16944fde	["super_admin"]	2026-06-13 20:37:03	\N	2026-06-12 21:47:55	2026-06-13 20:37:03
205	App\\Models\\User	23	student-session	08ff920531a2267801c6ca48aa042d4555eb79e87e84a55d38499c3e9ca1c7be	["student"]	2026-06-01 09:09:54	\N	2026-06-01 08:57:49	2026-06-01 09:09:54
206	App\\Models\\User	31	student-session	6eb7ac6fa9af3a2009625836af7140426a596a9296c0650e474dfafcafa90046	["student"]	2026-06-01 09:13:40	\N	2026-06-01 09:11:43	2026-06-01 09:13:40
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_attempts (id, student_id, quiz_id, lesson_id, selected_question_ids, submitted_answers, score, correct_count, total_questions, passed, started_at, submitted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_questions (id, quiz_id, question, options, correct_answer, "order", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quizzes (id, lesson_id, type, is_active, created_at, updated_at, questions_per_attempt, min_bank_size) FROM stdin;
\.


--
-- Data for Name: session_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_ratings (id, session_id, student_id, teacher_id, rating, notes, created_at, updated_at) FROM stdin;
1	37	29	35	5	\N	2026-06-09 18:03:31	2026-06-09 18:03:31
2	38	29	35	4	\N	2026-06-09 20:35:51	2026-06-09 20:35:51
3	43	29	35	5	\N	2026-06-10 17:36:43	2026-06-10 17:36:43
4	45	40	35	2	\N	2026-06-10 21:09:34	2026-06-10 21:09:34
5	52	29	35	5	\N	2026-06-12 16:19:22	2026-06-12 16:19:22
\.


--
-- Data for Name: session_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_requests (id, type, requested_by, student_id, target_teacher_id, assigned_teacher_id, lesson_id, lead_id, requested_at_utc, confirmed_at, status, rejection_reason, cancellation_reason, session_id, created_at, updated_at, teacher_gender_pref, note) FROM stdin;
99	core	29	29	\N	\N	10	\N	2026-06-10 06:00:00	\N	cancelled	\N	\N	\N	2026-06-09 20:45:02	2026-06-09 20:45:51	\N	\N
2	demo	1	1	\N	\N	254	14	2026-05-19 10:00:00	\N	cancelled	\N	\N	\N	2026-05-18 15:43:45	2026-05-18 16:01:03	\N	\N
1	demo	11	11	\N	\N	254	14	2026-05-18 17:42:22	\N	cancelled	\N	\N	\N	2026-05-18 15:42:22	2026-05-18 16:01:06	\N	\N
101	core	29	29	\N	\N	11	\N	2026-06-10 08:30:00	\N	cancelled	\N	\N	\N	2026-06-09 21:41:51	2026-06-09 21:42:10	\N	\N
4	demo	1	1	\N	\N	254	12	2026-05-19 18:00:00	\N	cancelled	\N	\N	\N	2026-05-18 15:55:52	2026-05-18 16:40:35	\N	\N
3	demo	1	1	\N	\N	254	51	2026-05-18 17:00:00	\N	expired	\N	\N	\N	2026-05-18 15:46:03	2026-05-18 21:00:33	\N	\N
5	demo	11	11	\N	\N	254	50	2026-05-18 17:00:00	\N	expired	\N	\N	\N	2026-05-18 16:26:13	2026-05-18 21:00:33	\N	\N
6	demo	11	11	\N	\N	254	14	2026-05-18 18:00:00	\N	expired	\N	\N	\N	2026-05-18 16:27:42	2026-05-18 21:00:33	\N	\N
7	demo	1	17	\N	\N	254	50	2026-05-21 16:00:00	\N	expired	\N	\N	\N	2026-05-20 01:11:56	2026-05-21 17:00:54	\N	\N
102	core	29	29	\N	\N	11	\N	2026-06-10 06:00:00	\N	cancelled	\N	\N	\N	2026-06-09 21:42:21	2026-06-09 21:42:30	\N	\N
43	demo	\N	\N	\N	\N	\N	55	2026-06-15 10:00:00	\N	cancelled	\N	\N	\N	2026-05-29 19:22:14	2026-05-29 19:23:48	\N	\N
100	core	29	29	\N	35	11	\N	2026-06-10 06:00:00	2026-06-09 21:25:17	expired	\N	\N	39	2026-06-09 21:24:31	2026-06-10 10:15:52	\N	\N
105	demo	39	39	\N	\N	255	63	2026-06-10 16:00:00	\N	expired	\N	\N	\N	2026-06-10 15:56:39	2026-06-10 16:00:19	\N	\N
51	demo	\N	\N	\N	\N	\N	58	2026-05-31 23:30:00	\N	cancelled	\N	\N	\N	2026-05-31 17:04:15	2026-05-31 17:18:13	\N	\N
52	demo	\N	\N	\N	\N	\N	58	2026-05-31 23:30:00	\N	cancelled	\N	\N	\N	2026-05-31 17:18:35	2026-05-31 17:22:26	\N	\N
107	demo	1	39	\N	\N	255	63	2026-06-10 19:00:00	\N	cancelled	\N	\N	\N	2026-06-10 16:24:58	2026-06-10 16:25:20	\N	\N
53	demo	\N	\N	\N	\N	\N	58	2026-06-01 14:00:00	\N	cancelled	\N	\N	\N	2026-05-31 17:22:57	2026-05-31 17:30:29	\N	\N
54	demo	1	1	\N	\N	254	58	2026-06-01 18:00:00	\N	cancelled	\N	\N	\N	2026-05-31 17:36:24	2026-05-31 17:39:15	\N	\N
104	demo	1	29	\N	\N	255	58	2026-06-10 17:00:00	\N	expired	\N	\N	\N	2026-06-10 15:50:03	2026-06-10 17:00:20	\N	\N
103	core	29	29	\N	35	11	\N	2026-06-10 16:30:00	2026-06-10 16:22:25	expired	\N	\N	43	2026-06-10 15:49:14	2026-06-10 17:35:25	\N	\N
56	core	29	29	\N	\N	254	58	2026-05-31 21:30:00	\N	cancelled	\N	\N	\N	2026-05-31 17:40:50	2026-05-31 17:41:19	\N	\N
55	demo	1	1	\N	\N	254	58	2026-06-01 15:00:00	\N	cancelled	\N	\N	\N	2026-05-31 17:39:23	2026-05-31 17:41:29	\N	\N
106	core	39	39	\N	35	73	\N	2026-06-10 17:30:00	2026-06-10 16:20:44	expired	\N	\N	42	2026-06-10 16:18:52	2026-06-10 17:45:26	\N	\N
57	core	29	29	\N	\N	254	58	2026-06-01 19:30:00	\N	cancelled	\N	\N	\N	2026-05-31 17:41:50	2026-05-31 17:45:48	\N	\N
108	core	29	29	\N	\N	11	\N	2026-06-10 17:30:00	\N	expired	\N	\N	\N	2026-06-10 17:54:00	2026-06-10 17:55:25	\N	\N
58	core	29	29	\N	\N	254	58	2026-06-01 15:30:00	\N	cancelled	\N	\N	\N	2026-05-31 17:50:25	2026-05-31 17:51:10	\N	\N
109	demo	1	39	\N	\N	255	63	2026-06-10 20:00:00	\N	cancelled	\N	\N	\N	2026-06-10 19:18:25	2026-06-10 19:27:23	\N	\N
59	core	29	29	\N	\N	254	58	2026-06-01 17:30:00	\N	cancelled	\N	\N	\N	2026-05-31 17:51:37	2026-05-31 17:55:29	\N	\N
60	demo	29	29	\N	\N	254	58	2026-06-01 09:00:00	\N	cancelled	\N	\N	\N	2026-05-31 17:55:40	2026-05-31 17:58:00	\N	\N
61	demo	1	29	\N	\N	254	58	2026-06-01 11:00:00	\N	cancelled	\N	\N	\N	2026-05-31 18:00:39	2026-05-31 18:12:47	\N	\N
110	demo	1	39	\N	\N	255	63	2026-06-10 20:00:00	\N	cancelled	\N	\N	\N	2026-06-10 19:27:33	2026-06-10 19:31:50	\N	ملاحظة تجريبية: أريد التركيز على الأسئلة
111	demo	1	39	\N	\N	255	63	2026-06-11 06:00:00	\N	cancelled	\N	\N	\N	2026-06-10 19:32:56	2026-06-10 19:35:22	\N	\N
62	core	29	29	\N	\N	9	\N	2026-06-01 10:30:00	\N	expired	\N	\N	\N	2026-05-31 18:26:41	2026-06-01 12:00:11	\N	\N
112	demo	1	39	\N	\N	255	63	2026-06-11 06:00:00	\N	cancelled	\N	\N	\N	2026-06-10 19:37:53	2026-06-10 19:37:55	\N	\N
44	demo	1	1	\N	\N	254	\N	2026-05-30 18:00:00	\N	cancelled	\N	\N	\N	2026-05-29 19:25:16	2026-05-29 19:25:20	\N	\N
45	demo	\N	\N	\N	\N	\N	\N	2026-05-29 23:30:00	\N	cancelled	\N	\N	\N	2026-05-29 19:45:29	2026-05-29 20:49:47	\N	\N
114	demo	40	40	\N	35	255	62	2026-06-10 20:30:00	2026-06-10 20:35:22	expired	\N	\N	45	2026-06-10 20:11:37	2026-06-10 20:45:53	female	بدي معلم عربي
115	core	29	29	\N	\N	11	\N	2026-06-11 06:00:00	\N	cancelled	\N	\N	\N	2026-06-10 21:28:51	2026-06-11 00:01:20	\N	ةةوووووة
113	demo	1	39	\N	\N	255	63	2026-06-11 07:00:00	\N	expired	\N	\N	\N	2026-06-10 19:38:12	2026-06-11 09:40:53	\N	المعلم عربي \nذكر
117	private	29	29	41	41	11	\N	2026-06-11 06:00:00	2026-06-11 00:36:24	expired	\N	\N	46	2026-06-11 00:36:03	2026-06-11 09:40:53	\N	\N
116	demo	40	40	\N	41	254	62	2026-06-11 12:00:00	2026-06-11 11:49:42	expired	\N	\N	48	2026-06-10 22:55:34	2026-06-11 12:15:42	male	\N
118	demo	40	40	\N	41	254	62	2026-06-11 13:00:00	2026-06-11 12:53:19	expired	\N	\N	49	2026-06-11 12:52:52	2026-06-11 13:15:17	\N	\N
119	core	29	29	\N	35	11	\N	2026-06-12 14:00:00	2026-06-12 13:30:18	expired	\N	\N	50	2026-06-12 13:28:43	2026-06-12 14:15:12	\N	\N
120	demo	1	29	\N	35	254	58	2026-06-12 15:00:00	2026-06-12 13:36:08	expired	\N	\N	51	2026-06-12 13:35:22	2026-06-12 15:15:20	\N	\N
121	core	29	29	\N	35	12	\N	2026-06-12 15:30:00	2026-06-12 15:17:08	expired	\N	\N	52	2026-06-12 15:11:15	2026-06-12 15:45:19	\N	\N
85	demo	1	29	\N	\N	255	58	2026-06-09 15:00:00	\N	expired	\N	\N	\N	2026-06-09 13:31:43	2026-06-09 15:00:33	\N	\N
87	demo	1	40	\N	\N	255	62	2026-06-09 15:00:00	\N	expired	\N	\N	\N	2026-06-09 13:37:52	2026-06-09 15:00:33	\N	\N
86	core	29	29	\N	\N	9	\N	2026-06-09 14:30:00	\N	expired	\N	\N	\N	2026-06-09 13:33:31	2026-06-09 15:00:34	\N	\N
92	core	29	29	\N	\N	9	\N	2026-06-09 17:00:00	\N	cancelled	\N	\N	\N	2026-06-09 17:23:11	2026-06-09 17:23:27	\N	\N
72	demo	1	22	\N	35	255	52	2026-06-08 14:00:00	2026-06-08 22:19:21	expired	\N	\N	21	2026-06-07 15:52:40	2026-06-09 17:26:17	\N	\N
89	core	29	29	\N	35	9	\N	2026-06-09 15:30:00	2026-06-09 15:10:57	expired	\N	\N	34	2026-06-09 15:10:29	2026-06-09 17:26:17	female	\N
90	demo	1	29	\N	\N	255	58	2026-06-09 16:00:00	\N	expired	\N	\N	\N	2026-06-09 15:15:07	2026-06-09 17:26:17	\N	\N
88	demo	1	40	\N	35	253	62	2026-06-09 16:00:00	2026-06-09 17:22:26	expired	\N	\N	36	2026-06-09 15:09:40	2026-06-09 17:26:17	\N	\N
91	core	29	29	\N	35	9	\N	2026-06-09 17:00:00	2026-06-09 16:30:59	expired	\N	\N	35	2026-06-09 16:26:32	2026-06-09 17:26:17	female	\N
94	demo	1	29	\N	\N	255	58	2026-06-09 18:00:00	\N	expired	\N	\N	\N	2026-06-09 17:26:48	2026-06-09 18:00:26	\N	\N
95	core	29	29	\N	\N	10	\N	2026-06-09 20:00:00	\N	cancelled	\N	\N	\N	2026-06-09 18:10:29	2026-06-09 18:10:46	\N	\N
98	core	29	29	\N	\N	10	\N	2026-06-10 06:00:00	\N	cancelled	\N	\N	\N	2026-06-09 20:28:41	2026-06-09 20:28:50	male	\N
93	core	29	29	\N	35	9	\N	2026-06-09 17:30:00	2026-06-09 17:30:26	expired	\N	\N	37	2026-06-09 17:23:35	2026-06-09 20:34:23	\N	\N
97	demo	1	29	\N	\N	255	58	2026-06-09 19:00:00	\N	expired	\N	\N	\N	2026-06-09 18:11:15	2026-06-09 20:34:23	\N	\N
96	core	29	29	\N	35	10	\N	2026-06-09 18:30:00	2026-06-09 18:20:05	expired	\N	\N	38	2026-06-09 18:10:52	2026-06-09 20:34:23	\N	\N
122	core	29	29	\N	35	13	\N	2026-06-12 16:30:00	2026-06-12 16:26:58	expired	\N	\N	53	2026-06-12 16:21:02	2026-06-12 16:45:20	\N	\N
123	demo	1	39	\N	35	254	63	2026-06-12 19:00:00	2026-06-12 17:58:40	expired	\N	\N	54	2026-06-12 17:54:29	2026-06-12 21:45:33	\N	\N
125	demo	1	39	\N	\N	254	63	2026-06-13 19:00:00	\N	cancelled	\N	\N	\N	2026-06-13 18:17:56	2026-06-13 18:18:14	\N	\N
124	core	39	39	\N	35	37	\N	2026-06-13 19:00:00	2026-06-13 18:54:46	expired	\N	\N	55	2026-06-13 18:16:52	2026-06-13 19:15:40	\N	تتتاااتن
126	core	29	29	\N	38	1	\N	2026-06-13 19:00:00	2026-06-13 18:57:03	expired	\N	\N	56	2026-06-13 18:31:45	2026-06-13 20:00:42	\N	تاتتتا
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, lesson_id, teacher_id, student_id, status, daily_room_name, daily_room_url, nearpod_pin, scheduled_at, started_at, ended_at, created_at, updated_at, deleted_at, student_joined_at, teacher_joined_at, attendance_status, teacher_present, student_present, teacher_started_at, teacher_ended_at, evaluation_submitted_at, reminder_sent_at) FROM stdin;
53	13	35	29	completed	ifluent-session-53	https://ifluent.daily.co/ifluent-session-53	B5W8D	2026-06-12 16:30:00	2026-06-12 16:29:32	2026-06-12 16:42:38	2026-06-12 16:26:56	2026-06-12 16:42:39	\N	2026-06-12 16:30:17	2026-06-12 16:29:32	attended	t	t	2026-06-12 16:29:32	2026-06-12 16:42:38	\N	2026-06-12 16:27:19
52	12	35	29	completed	ifluent-session-52	https://ifluent.daily.co/ifluent-session-52	FJVIZ	2026-06-12 15:30:00	2026-06-12 15:18:48	2026-06-12 16:13:52	2026-06-12 15:17:06	2026-06-12 16:13:53	\N	2026-06-12 15:19:00	2026-06-12 15:18:48	attended	t	t	2026-06-12 15:18:48	2026-06-12 16:13:52	\N	\N
51	254	35	29	completed	ifluent-session-51	https://ifluent.daily.co/ifluent-session-51	b82d3	2026-06-12 15:00:00	2026-06-12 15:02:50	2026-06-12 15:11:07	2026-06-12 13:36:07	2026-06-12 15:11:09	\N	2026-06-12 15:03:06	2026-06-12 15:02:50	absent	t	t	2026-06-12 15:02:50	2026-06-12 15:11:07	\N	2026-06-12 14:50:13
50	11	35	29	completed	ifluent-session-50	https://ifluent.daily.co/ifluent-session-50	WPCK9	2026-06-12 14:00:00	2026-06-12 13:58:34	2026-06-12 14:59:06	2026-06-12 13:30:13	2026-06-12 14:59:07	\N	2026-06-12 13:58:59	2026-06-12 13:58:34	attended	t	t	2026-06-12 13:58:34	2026-06-12 14:59:06	\N	2026-06-12 13:50:12
54	254	35	39	completed	ifluent-session-54	https://ifluent.daily.co/ifluent-session-54	\N	2026-06-12 19:00:00	\N	2026-06-12 21:45:33	2026-06-12 17:58:38	2026-06-12 21:45:33	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
7	255	35	22	cancelled	ifluent-session-7	https://ifluent.daily.co/ifluent-session-7	\N	2026-06-08 14:00:00	\N	2026-06-07 16:01:02	2026-06-07 15:53:01	2026-06-07 16:01:02	\N	\N	\N	\N	f	f	\N	\N	\N	\N
8	255	35	22	cancelled	ifluent-session-8	https://ifluent.daily.co/ifluent-session-8	\N	2026-06-08 14:00:00	\N	2026-06-07 16:08:09	2026-06-07 16:07:59	2026-06-07 16:08:09	\N	\N	\N	\N	f	f	\N	\N	\N	\N
55	37	35	39	completed	ifluent-session-55	https://ifluent.daily.co/ifluent-session-55	\N	2026-06-13 19:00:00	\N	2026-06-13 19:15:40	2026-06-13 18:54:45	2026-06-13 19:15:41	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	2026-06-13 18:54:54
56	1	38	29	completed	ifluent-session-56	https://ifluent.daily.co/ifluent-session-56	su7vr	2026-06-13 19:00:00	2026-06-13 18:58:43	2026-06-13 20:00:42	2026-06-13 18:57:01	2026-06-13 20:00:42	\N	2026-06-13 18:58:53	2026-06-13 18:58:43	attended	t	t	2026-06-13 18:58:43	\N	\N	2026-06-13 18:57:54
36	253	35	40	completed	ifluent-session-36	https://ifluent.daily.co/ifluent-session-36	\N	2026-06-09 16:00:00	\N	2026-06-09 17:25:26	2026-06-09 17:22:25	2026-06-09 17:25:26	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
35	9	35	29	completed	ifluent-session-35	https://ifluent.daily.co/ifluent-session-35	DKRP4	2026-06-09 17:00:00	\N	2026-06-09 17:26:17	2026-06-09 16:30:57	2026-06-09 17:26:17	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
18	255	35	22	cancelled	ifluent-session-18	https://ifluent.daily.co/ifluent-session-18	\N	2026-06-08 14:00:00	\N	2026-06-08 13:04:07	2026-06-08 11:04:17	2026-06-08 13:04:07	\N	\N	\N	\N	f	f	\N	\N	\N	\N
46	11	41	29	completed	ifluent-session-46	https://ifluent.daily.co/ifluent-session-46	\N	2026-06-11 06:00:00	\N	2026-06-11 09:40:53	2026-06-11 00:36:22	2026-06-11 09:40:53	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
37	9	35	29	completed	ifluent-session-37	https://ifluent.daily.co/ifluent-session-37	JI47V	2026-06-09 17:30:00	2026-06-09 17:32:21	2026-06-09 18:01:56	2026-06-09 17:30:24	2026-06-09 18:01:57	\N	2026-06-09 17:32:41	2026-06-09 17:32:21	attended	t	t	2026-06-09 17:32:21	2026-06-09 18:01:56	\N	\N
21	255	35	22	completed	ifluent-session-21	https://ifluent.daily.co/ifluent-session-21	\N	2026-06-08 14:00:00	\N	2026-06-08 22:20:44	2026-06-08 22:19:20	2026-06-08 22:20:44	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
22	73	35	29	completed	\N	\N	\N	2026-06-08 22:41:32	2026-06-08 22:41:32	2026-06-08 22:41:32	2026-06-08 22:41:32	2026-06-08 22:41:32	\N	\N	\N	attended	t	t	\N	2026-06-08 22:41:32	\N	\N
23	73	35	29	completed	\N	\N	\N	2026-06-08 20:41:40	2026-06-08 21:11:40	2026-06-08 22:41:40	2026-06-08 22:41:40	2026-06-08 22:41:40	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
24	73	35	29	completed	\N	\N	\N	2026-06-08 20:42:00	2026-06-08 21:12:00	2026-06-08 22:42:00	2026-06-08 22:42:00	2026-06-08 22:42:00	\N	\N	\N	absent	t	f	\N	\N	\N	\N
25	73	35	29	completed	\N	\N	\N	2026-06-08 20:42:00	2026-06-08 21:12:00	2026-06-08 22:42:00	2026-06-08 22:42:00	2026-06-08 22:42:00	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
43	11	35	29	completed	ifluent-session-43	https://ifluent.daily.co/ifluent-session-43	H9MC7	2026-06-10 16:30:00	2026-06-10 16:31:24	2026-06-10 17:35:25	2026-06-10 16:22:24	2026-06-10 17:35:25	\N	2026-06-10 16:31:45	2026-06-10 16:31:24	attended	t	t	2026-06-10 16:31:24	\N	\N	\N
42	73	35	39	completed	ifluent-session-42	https://ifluent.daily.co/ifluent-session-42	\N	2026-06-10 17:30:00	\N	2026-06-10 17:45:26	2026-06-10 16:20:42	2026-06-10 17:45:26	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
38	10	35	29	completed	ifluent-session-38	https://ifluent.daily.co/ifluent-session-38	6E9GB	2026-06-09 18:30:00	2026-06-09 18:22:40	2026-06-09 20:34:23	2026-06-09 18:20:03	2026-06-09 20:34:23	\N	2026-06-09 18:23:02	2026-06-09 18:22:40	attended	t	t	2026-06-09 18:22:40	\N	\N	\N
34	9	35	29	completed	ifluent-session-34	https://ifluent.daily.co/ifluent-session-34	\N	2026-06-09 15:30:00	\N	2026-06-09 16:10:01	2026-06-09 15:10:53	2026-06-09 16:10:01	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
39	11	35	29	completed	ifluent-session-39	https://ifluent.daily.co/ifluent-session-39	\N	2026-06-10 06:00:00	\N	2026-06-10 10:15:52	2026-06-09 21:25:15	2026-06-10 10:15:53	\N	\N	\N	teacher_absent	f	f	\N	\N	\N	\N
40	11	35	29	cancelled	ifluent-session-40	https://ifluent.daily.co/ifluent-session-40	\N	2026-06-10 16:30:00	\N	2026-06-10 15:50:43	2026-06-10 15:50:26	2026-06-10 15:50:43	\N	\N	\N	\N	f	f	\N	\N	\N	\N
41	255	35	29	cancelled	ifluent-session-41	https://ifluent.daily.co/ifluent-session-41	\N	2026-06-10 17:00:00	\N	2026-06-10 16:20:33	2026-06-10 15:51:00	2026-06-10 16:20:33	\N	\N	\N	\N	f	f	\N	\N	\N	\N
44	255	35	39	cancelled	ifluent-session-44	https://ifluent.daily.co/ifluent-session-44	\N	2026-06-10 20:00:00	\N	2026-06-10 19:29:11	2026-06-10 19:27:59	2026-06-10 19:29:11	\N	\N	\N	\N	f	f	\N	\N	\N	\N
47	254	41	40	cancelled	ifluent-session-47	https://ifluent.daily.co/ifluent-session-47	\N	2026-06-11 12:00:00	\N	2026-06-11 09:44:21	2026-06-11 09:44:09	2026-06-11 09:44:21	\N	\N	\N	\N	f	f	\N	\N	\N	\N
49	254	41	40	completed	ifluent-session-49	https://ifluent.daily.co/ifluent-session-49	RFYVG	2026-06-11 13:00:00	2026-06-11 13:13:19	2026-06-11 13:21:44	2026-06-11 12:53:17	2026-06-11 13:21:45	\N	2026-06-11 13:13:38	2026-06-11 13:13:19	absent	t	t	2026-06-11 13:13:19	2026-06-11 13:21:44	\N	\N
45	255	35	40	completed	ifluent-session-45	https://ifluent.daily.co/ifluent-session-45	VY5UG	2026-06-10 20:30:00	2026-06-10 20:36:49	2026-06-10 21:07:26	2026-06-10 20:35:21	2026-06-10 21:20:51	\N	2026-06-10 20:43:14	2026-06-10 20:36:49	attended	t	t	2026-06-10 20:36:49	2026-06-10 21:07:26	2026-06-10 21:20:51	\N
48	254	41	40	completed	ifluent-session-48	https://ifluent.daily.co/ifluent-session-48	JX8HI	2026-06-11 12:00:00	2026-06-11 11:51:15	2026-06-11 11:51:47	2026-06-11 11:49:40	2026-06-11 11:51:48	\N	\N	2026-06-11 11:51:15	absent	t	f	2026-06-11 11:51:15	2026-06-11 11:51:47	\N	\N
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_settings (id, key, value, type, label, "group", created_at, updated_at) FROM stdin;
1	hero_title	"تعلّم الإنجليزية مع أفضل المعلمين"	text	Hero Title	hero	2026-05-09 17:30:16	2026-05-09 17:30:16
4	hero_image	\N	image	Hero Image	hero	2026-05-09 17:30:16	2026-05-09 17:30:16
5	about_title	"من نحن"	text	About Title	about	2026-05-09 17:30:16	2026-05-09 17:30:16
6	about_text	"iFluent منصة متكاملة لتعليم اللغة الإنجليزية عبر جلسات حية مع معلمين متخصصين."	html	About Text	about	2026-05-09 17:30:16	2026-05-09 17:30:16
7	about_image	\N	image	About Image	about	2026-05-09 17:30:16	2026-05-09 17:30:16
8	contact_phone	"+962 7 0000 0000"	text	Phone	contact	2026-05-09 17:30:16	2026-05-09 17:30:16
9	contact_email	"info@ifluent.io"	text	Email	contact	2026-05-09 17:30:16	2026-05-09 17:30:16
10	contact_whatsapp	"+962 7 0000 0000"	text	WhatsApp	contact	2026-05-09 17:30:16	2026-05-09 17:30:16
12	social_facebook	\N	text	Facebook URL	footer	2026-05-09 17:30:16	2026-05-09 17:30:16
13	social_tiktok	\N	text	TikTok URL	footer	2026-05-09 17:30:16	2026-05-09 17:30:16
14	footer_text	"© 2026 iFluent. جميع الحقوق محفوظة."	text	Footer Text	footer	2026-05-09 17:30:16	2026-05-09 17:30:16
15	platform_name	"iFluent"	text	Platform Name	general	2026-05-09 17:30:16	2026-05-09 17:30:16
16	logo	\N	image	Logo	general	2026-05-09 17:30:16	2026-05-09 17:30:16
17	favicon	\N	image	Favicon	general	2026-05-09 17:30:16	2026-05-09 17:30:16
18	app_store_url	\N	text	App Store URL	footer	2026-05-11 18:42:42	2026-05-11 18:42:42
19	google_play_url	\N	text	Google Play URL	footer	2026-05-11 18:42:42	2026-05-11 18:42:42
2	hero_subtitle	"حصص تفاعلية مع معلمين عرب واجانب - جدول حصصك مع معلمك المفضل وابدا بالتعلم"	text	Hero Subtitle	hero	2026-05-09 17:30:16	2026-05-13 18:24:46
11	social_instagram	"https://www.instagram.com/ifluentapp?igsh=MWo3NHQ5dzZ3Z3oxZw=="	text	Instagram URL	footer	2026-05-09 17:30:16	2026-05-13 18:36:56
3	hero_cta_text	"احجز حصة تقييم مستوى مجانية"	text	CTA Button Text	hero	2026-05-09 17:30:16	2026-05-17 13:51:24
20	price_per_lesson	6	number	سعر الشهر الواحد (دينار)	pricing	2026-05-19 23:02:23	2026-05-20 02:20:22
\.


--
-- Data for Name: student_curriculum_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_curriculum_assignments (id, student_id, level_code, from_lesson, to_lesson, next_lesson, assigned_by, is_active, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_progress (id, student_id, lesson_id, quiz_id, score, attempts, passed, passed_at, lesson_completed, completed_at, created_at, updated_at) FROM stdin;
1	29	9	\N	\N	0	f	\N	t	2026-06-09 18:01:56	2026-06-11 00:49:55	2026-06-11 00:49:55
2	29	73	\N	\N	0	f	\N	t	2026-06-08 22:41:32	2026-06-11 00:49:55	2026-06-11 00:49:55
4	29	10	\N	\N	0	f	\N	t	2026-06-09 20:34:23	2026-06-11 00:49:55	2026-06-11 00:49:55
5	40	255	\N	\N	0	f	\N	t	2026-06-10 21:07:26	2026-06-11 00:49:55	2026-06-11 00:49:55
3	29	11	\N	\N	0	f	\N	t	2026-06-12 14:59:07	2026-06-11 00:49:55	2026-06-12 14:59:07
6	29	12	\N	\N	0	f	\N	t	2026-06-12 16:13:53	2026-06-12 16:13:53	2026-06-12 16:13:53
7	29	13	\N	\N	0	f	\N	t	2026-06-12 16:42:39	2026-06-12 16:42:39	2026-06-12 16:42:39
\.


--
-- Data for Name: student_units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_units (id, student_id, unit_id, status, enrolled_at, completed_at, expires_at, created_at, updated_at) FROM stdin;
2	17	3	active	2026-06-09 23:36:35	\N	\N	2026-06-09 23:36:35	2026-06-09 23:36:35
3	17	1	active	2026-06-09 23:36:35	\N	\N	2026-06-09 23:36:35	2026-06-09 23:36:35
4	17	2	active	2026-06-09 23:36:35	\N	\N	2026-06-09 23:36:35	2026-06-09 23:36:35
5	18	3	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
6	18	1	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
7	18	2	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
8	19	3	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
9	19	1	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
10	19	2	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
11	21	3	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
12	21	1	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
13	21	2	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
14	29	3	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
15	29	1	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
16	29	2	active	2026-06-09 23:36:36	\N	\N	2026-06-09 23:36:36	2026-06-09 23:36:36
20	39	8	active	2026-06-10 16:16:27	\N	\N	2026-06-10 16:16:27	2026-06-10 16:16:27
21	39	7	active	2026-06-10 16:16:27	\N	\N	2026-06-10 16:16:27	2026-06-10 16:16:27
22	39	4	active	2026-06-12 12:50:28	\N	\N	2026-06-12 12:50:28	2026-06-12 12:50:28
23	39	5	active	2026-06-12 12:50:28	\N	\N	2026-06-12 12:50:28	2026-06-12 12:50:28
24	39	6	active	2026-06-12 12:50:28	\N	\N	2026-06-12 12:50:28	2026-06-12 12:50:28
25	29	4	active	2026-06-13 18:29:39	\N	\N	2026-06-13 18:29:39	2026-06-13 18:29:39
26	29	5	active	2026-06-13 18:29:39	\N	\N	2026-06-13 18:29:39	2026-06-13 18:29:39
27	29	6	active	2026-06-13 18:29:39	\N	\N	2026-06-13 18:29:39	2026-06-13 18:29:39
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, user_id, lead_id, profile_photo, created_at, updated_at) FROM stdin;
3	17	50	\N	2026-05-19 23:07:00	2026-05-19 23:07:00
4	18	48	\N	2026-05-20 00:28:11	2026-05-20 00:28:11
5	19	12	\N	2026-05-20 00:33:05	2026-05-20 00:33:05
7	21	49	\N	2026-05-20 02:23:27	2026-05-20 02:23:27
8	22	52	\N	2026-05-24 20:35:51	2026-05-24 20:35:51
15	29	58	\N	2026-05-31 16:55:46	2026-05-31 17:40:50
22	40	62	\N	2026-06-09 13:37:41	2026-06-09 13:37:41
21	39	63	\N	2026-06-09 13:26:28	2026-06-10 15:56:39
23	42	\N	\N	2026-06-12 15:37:46	2026-06-12 15:37:46
24	43	\N	\N	2026-06-13 18:20:17	2026-06-13 18:20:17
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, student_id, package_id, activated_by, approved_by, status, amount_paid, payment_method, payment_reference, payment_screenshot, activated_at, approved_at, expires_at, created_at, updated_at, invoice_uuid, months_count, payment_account_id, lessons_count, from_lesson_id, to_lesson_id, current_lesson_id) FROM stdin;
31	21	\N	1	\N	cancelled	144.00	\N	\N	\N	\N	\N	\N	2026-06-10 15:59:18	2026-06-10 16:02:56	30c8fc2e-d2d5-4e87-9d27-bab2f1f73c2e	2	2	24	73	96	\N
3	4	\N	1	1	cancelled	450.00	\N	\N	payments/screenshots/hnec0gPlRo5bq1Yh5Skm3Am9ohS8wUnQgZVROr6u.jpg	2026-05-20 00:30:32	2026-05-20 00:30:32	2027-02-20 00:30:32	2026-05-20 00:28:11	2026-06-12 13:25:18	e3762461-4fc8-4c0b-9a1b-08e0b8c84188	9	2	108	1	36	1
34	15	\N	1	1	active	432.00	\N	\N	payments/screenshots/zbr6C0pzThJ7cF4zO4ECqJN7nfPBcyV2tkHkVCeT.png	2026-06-13 18:29:39	2026-06-13 18:29:39	2026-12-13 18:29:39	2026-06-13 18:29:22	2026-06-13 18:29:39	577ea440-3b68-4d89-8f8d-b48d26957c1e	6	2	72	1	72	1
33	21	\N	1	1	cancelled	216.00	\N	\N	payments/screenshots/IzIR5QZ53kVMCIDFx0OH4n9yGpzPyvYjkE2oWKyh.png	2026-06-12 12:50:28	2026-06-12 12:50:28	2026-09-12 12:50:28	2026-06-10 20:04:49	2026-06-13 18:50:32	115d9cd0-6d94-4a2e-85ac-2b605f5e7193	3	1	36	37	72	37
2	3	\N	11	1	active	120.00	\N	\N	payments/screenshots/7XRMzrDLmMQKboANjcDUltPb7L5bSSGVrQrEDJLx.jpg	2026-05-20 00:10:15	2026-05-20 00:10:15	2026-08-20 00:10:15	2026-05-19 23:07:00	2026-05-31 02:12:09	e5394a65-6e7a-4154-8a9a-ea0fc003a407	3	1	36	1	36	1
4	5	\N	11	1	active	450.00	\N	\N	payments/screenshots/zAk5f2dSURYgtgBaWaLiKTmgTJngZLvt4DP0wwpU.jpg	2026-05-20 00:38:52	2026-05-20 00:38:52	2027-02-20 00:38:52	2026-05-20 00:33:05	2026-05-31 02:12:09	a6c69100-1b87-4723-92ec-012d06c922e0	9	3	108	1	36	1
7	3	\N	1	1	active	150.00	\N	\N	payments/screenshots/dewBuDajQ18CvIKMCvGoGqgC46CYImaTgF7zAsGc.jpg	2026-05-20 01:03:54	2026-05-20 01:03:54	2026-08-20 01:03:54	2026-05-20 01:03:23	2026-05-31 02:12:09	8e7d464e-1acf-4597-b84a-95fb1365fc20	3	3	36	1	36	1
8	7	\N	1	1	active	72.00	\N	\N	payments/screenshots/TUqOQUOFHrteEYMfcQ0vhIlgPbfvQE6mNCUsZxzJ.jpg	2026-05-20 02:24:04	2026-05-20 02:24:04	2026-06-20 02:24:04	2026-05-20 02:23:27	2026-05-31 02:12:09	31c207b0-8999-415d-96a0-73ca745b8d46	1	1	12	1	36	1
10	15	\N	1	1	cancelled	130.00	\N	\N	payments/screenshots/JwogecbrVHaACtaGTJqPMKmVsdo96fZjxGIMlDp7.png	\N	2026-05-31 18:09:43	\N	2026-05-31 18:03:35	2026-05-31 18:09:43	c968b1d6-9120-41a0-b8db-efca03ecb4a2	2	3	22	\N	\N	\N
11	15	\N	1	1	cancelled	132.00	\N	\N	payments/screenshots/oyQk2cBbIsybdum5qoUueqXRkcT6LTp4276d56Xa.png	\N	2026-05-31 18:21:04	\N	2026-05-31 18:13:39	2026-05-31 18:21:04	71dfe7e0-529c-41cd-8a75-8eb7c0ebc576	2	1	22	15	36	\N
32	21	\N	1	1	cancelled	144.00	\N	\N	payments/screenshots/IlbQMhXm6nDQk0Gniy3OzX4sJSUwcziyPDb3psdr.png	2026-06-10 16:16:27	2026-06-10 16:16:27	2026-08-10 16:16:27	2026-06-10 16:03:25	2026-06-10 20:04:40	7e57e3a3-68e2-4165-8dee-2e7119b9c713	2	3	24	73	96	73
12	15	\N	1	1	cancelled	66.00	\N	\N	payments/screenshots/UuIW0XXeJgsnfiia5YXgmt5aQ2rH0etmUx3ejkXD.png	\N	2026-05-31 18:22:19	\N	2026-05-31 18:21:37	2026-05-31 18:22:19	ce593c69-b810-4c9a-8823-df7dee9fb4ef	1	2	11	26	36	\N
13	15	\N	1	1	cancelled	168.00	\N	\N	payments/screenshots/Ljr57Hxu6GbsmnILggn09Lbhv5XT3vTWcmzvIUAK.png	2026-05-31 18:26:11	2026-05-31 18:26:11	2026-08-31 18:26:11	2026-05-31 18:22:38	2026-06-13 18:26:11	9d20b2a3-a286-4fbe-84fe-29aedd171cf5	3	3	28	9	36	14
35	21	\N	1	1	active	18.00	\N	\N	payments/screenshots/6xQfhcjA0nFZSCwMsox7tkKPgHGyzA0SRiFk2Jnu.jpg	2026-06-13 18:51:39	2026-06-13 18:51:39	2026-07-13 18:51:39	2026-06-13 18:51:08	2026-06-13 18:51:39	1d9f4b95-6e33-43de-9b36-3302141bda6f	1	3	3	94	96	94
15	15	\N	1	\N	cancelled	180.00	\N	\N	\N	\N	\N	\N	2026-06-01 08:59:23	2026-06-01 09:16:37	8e167f72-0ae5-4a50-acb0-ff2ec8dc1d20	3	2	30	41	70	\N
19	15	\N	1	\N	cancelled	96.00	\N	\N	\N	\N	\N	\N	2026-06-01 09:47:39	2026-06-01 09:48:08	b44b80d8-c9a9-4f91-a774-4465be69eed5	2	3	16	1	16	\N
20	15	\N	1	\N	cancelled	126.00	\N	\N	\N	\N	\N	\N	2026-06-01 09:48:27	2026-06-01 09:48:38	20f74f46-790e-4419-8ca1-b05e0c6b9d57	2	1	21	1	21	\N
\.


--
-- Data for Name: teacher_availability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teacher_availability (id, teacher_id, day_of_week, start_time, end_time, is_active, created_at, updated_at) FROM stdin;
1	35	0	18:30:00	19:00:00	t	2026-06-11 00:04:21	2026-06-11 00:04:21
2	35	5	17:00:00	20:00:00	t	2026-06-11 00:04:21	2026-06-11 00:04:21
3	35	5	18:30:00	19:00:00	t	2026-06-11 00:04:21	2026-06-11 00:04:21
4	35	5	18:30:00	19:00:00	t	2026-06-11 00:04:21	2026-06-11 00:04:21
5	38	1	09:30:00	16:30:00	t	2026-06-11 00:06:40	2026-06-11 00:06:40
6	41	0	08:00:00	15:30:00	t	2026-06-11 00:34:10	2026-06-11 00:34:10
7	41	6	07:00:00	14:30:00	t	2026-06-11 00:34:10	2026-06-11 00:34:10
\.


--
-- Data for Name: teacher_earnings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teacher_earnings (id, teacher_id, session_id, amount, session_type, notes, credited_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teachers (id, user_id, teacher_code, bio, specialization, profile_photo, commission_rate, balance, is_active, zoom_user_id, created_at, updated_at, sessions_count_reset_at, balance_reset_at, absences_reset_at) FROM stdin;
7	35	TCH-0007	3	\N	\N	2.50	0.00	t	\N	2026-06-03 12:57:38	2026-06-07 18:20:39	2026-06-07 18:20:39	2026-06-07 18:15:29	2026-06-07 18:20:39
8	36	TCH-0008	\N	\N	\N	0.00	0.00	t	\N	2026-06-07 18:57:58	2026-06-07 18:57:58	\N	\N	\N
9	37	TCH-TEMP	\N	\N	\N	0.00	0.00	t	\N	2026-06-07 19:09:09	2026-06-07 19:09:09	\N	\N	\N
10	38	T2	\N	\N	\N	0.00	0.00	t	\N	2026-06-07 19:11:14	2026-06-07 19:11:14	\N	\N	\N
11	41	TCH-0011	\N	\N	\N	0.00	0.00	t	\N	2026-06-11 00:25:55	2026-06-11 00:25:55	\N	\N	\N
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.units (id, level_id, name, name_en, "order", lesson_count, has_end_test, is_active, created_at, updated_at) FROM stdin;
1	1	الوحدة الأولى	Unit 1	1	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
2	1	الوحدة الثانية	Unit 2	2	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
3	1	الوحدة الثالثة	Unit 3	3	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
4	2	الوحدة الأولى	Unit 1	1	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
5	2	الوحدة الثانية	Unit 2	2	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
6	2	الوحدة الثالثة	Unit 3	3	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
7	3	الوحدة الأولى	Unit 1	1	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
8	3	الوحدة الثانية	Unit 2	2	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
9	3	الوحدة الثالثة	Unit 3	3	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
10	3	الوحدة الرابعة	Unit 4	4	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
11	3	الوحدة الخامسة	Unit 5	5	12	t	t	2026-05-09 13:30:57	2026-05-09 13:30:57
12	4	الوحدة الأولى	Unit 1	1	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
13	4	الوحدة الثانية	Unit 2	2	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
14	4	الوحدة الثالثة	Unit 3	3	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
15	4	الوحدة الرابعة	Unit 4	4	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
16	4	الوحدة الخامسة	Unit 5	5	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
17	5	الوحدة الأولى	Unit 1	1	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
18	5	الوحدة الثانية	Unit 2	2	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
19	5	الوحدة الثالثة	Unit 3	3	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
20	5	الوحدة الرابعة	Unit 4	4	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
21	5	الوحدة الخامسة	Unit 5	5	12	t	t	2026-05-09 13:30:58	2026-05-09 13:30:58
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, phone, email, email_verified_at, password, role, timezone, fcm_token, remember_token, created_at, updated_at, deleted_at, lesson_credits) FROM stdin;
11	test1	\N	test1@ifluent.jo	\N	$2y$12$iDjD1G6TU.8AHpot.JZoku5Qg/q9SS1EhGX/j12zyYLU2H6/Qfyoi	cc	Asia/Amman	\N	\N	2026-05-16 19:29:11	2026-05-16 19:29:11	\N	0
12	test2	\N	test2@ifluent.jo	\N	$2y$12$tROINSwgIOBjljOoKj0mwOKNcB3QO2SvC6Y/sy71zWpu/v8vjOS.m	ss	Asia/Amman	\N	\N	2026-05-17 12:58:28	2026-05-17 12:58:28	\N	0
22	عبد الله	0787621799	\N	\N	\N	student	Asia/Amman	\N	\N	2026-05-24 20:35:51	2026-05-24 20:35:51	\N	0
17	عمر	٠٧٨٧٦٢١٣١٤	\N	\N	\N	student	Asia/Amman	\N	\N	2026-05-19 23:07:00	2026-05-29 21:10:39	\N	36
19	عبد الرحمن	0787621713	\N	\N	\N	student	Asia/Amman	\N	\N	2026-05-20 00:33:05	2026-05-29 21:10:39	\N	108
21	عصام	٠٧٨٧٦٢١٤٣٥	\N	\N	\N	student	Asia/Amman	\N	\N	2026-05-20 02:23:27	2026-05-29 21:10:39	\N	12
41	لتجربة الاتاحة	\N	t7@ifluent.jo	\N	$2y$12$njIUZgK9mrvUBrSvQw6SMung305FGbj8gFyMAUHRx8o5/JdtuHYrm	teacher	Asia/Amman	\N	\N	2026-06-11 00:25:55	2026-06-11 00:25:55	\N	0
1	Admin iFluent	\N	SYazanadmin@ifluent.jo	\N	$2y$12$68y1bLFjj7cUMZ965kQawuT0aSSqrZITZb8WXvWyai3qNz1qXDEK6	super_admin	Asia/Amman	\N	\N	2026-05-07 00:44:53	2026-06-07 16:55:29	\N	0
18	ا	٠٧٨٧٦٢١١١١	\N	\N	\N	student	Asia/Amman	\N	\N	2026-05-20 00:28:11	2026-05-29 21:10:39	\N	0
35	test5 teacher	\N	test5@ifluent.jo	\N	$2y$12$6kI/si38MpV5PMzqAZj1ZumJrUTTkfeShG8FzKNCVdlmgiHQEpCwq	teacher	Asia/Amman	\N	\N	2026-06-03 12:57:38	2026-06-07 13:25:19	\N	0
36	test6	\N	test6@ifluent.jo	\N	$2y$12$6kI/si38MpV5PMzqAZj1ZumJrUTTkfeShG8FzKNCVdlmgiHQEpCwq	teacher	Asia/Amman	\N	\N	2026-06-07 18:57:58	2026-06-07 18:57:58	\N	0
37	Teacher2	\N	t2@test.jo	\N	$2y$12$6kI/si38MpV5PMzqAZj1ZumJrUTTkfeShG8FzKNCVdlmgiHQEpCwq	teacher	Asia/Amman	\N	\N	2026-06-07 19:09:08	2026-06-07 19:09:25	2026-06-07 19:09:25	0
38	T2	\N	t2@x.jo	\N	$2y$12$6kI/si38MpV5PMzqAZj1ZumJrUTTkfeShG8FzKNCVdlmgiHQEpCwq	teacher	Asia/Amman	\N	\N	2026-06-07 19:11:14	2026-06-07 19:11:14	\N	0
42	احمد سمير	0785177247	\N	\N	\N	student	Asia/Amman	\N	\N	2026-06-12 15:37:46	2026-06-12 15:37:46	\N	0
43	Student	+962782911521	\N	\N	\N	student	Asia/Amman	\N	\N	2026-06-13 18:20:17	2026-06-13 18:20:17	\N	0
29	مؤيد	0782911521	\N	\N	\N	student	Asia/Amman	ExponentPushToken[4GlMH1P_Gcb6VSPu8OVR4p]	\N	2026-05-31 16:55:46	2026-06-13 18:31:45	\N	71
40	me	0787621715	\N	\N	\N	student	Asia/Amman	ExponentPushToken[kdgy7xGamApdWkPHN3KBB8]	\N	2026-06-09 13:37:41	2026-06-13 18:49:42	\N	0
39	Student	+962787621715	\N	\N	\N	student	Asia/Amman	ExponentPushToken[23RITuI3Ur64etPP5r9lhJ]	\N	2026-06-09 13:26:28	2026-06-13 20:29:29	\N	4
\.


--
-- Name: admin_message_recipients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_message_recipients_id_seq', 30, true);


--
-- Name: admin_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_messages_id_seq', 4, true);


--
-- Name: curriculum_pdfs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.curriculum_pdfs_id_seq', 1, false);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 23, true);


--
-- Name: group_class_registrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_class_registrations_id_seq', 1, false);


--
-- Name: group_classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_classes_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: lead_remarks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lead_remarks_id_seq', 83, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leads_id_seq', 63, true);


--
-- Name: lesson_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lesson_bookings_id_seq', 1, false);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lessons_id_seq', 257, true);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.levels_id_seq', 5, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 62, true);


--
-- Name: notebook_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notebook_entries_id_seq', 7, true);


--
-- Name: otp_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.otp_codes_id_seq', 8, true);


--
-- Name: packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.packages_id_seq', 1, true);


--
-- Name: payment_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_accounts_id_seq', 3, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 352, true);


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_attempts_id_seq', 1, false);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_questions_id_seq', 1, false);


--
-- Name: quizzes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quizzes_id_seq', 1, false);


--
-- Name: session_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.session_ratings_id_seq', 5, true);


--
-- Name: session_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.session_requests_id_seq', 126, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 56, true);


--
-- Name: site_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.site_settings_id_seq', 20, true);


--
-- Name: student_curriculum_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_curriculum_assignments_id_seq', 1, false);


--
-- Name: student_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_progress_id_seq', 7, true);


--
-- Name: student_units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_units_id_seq', 27, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.students_id_seq', 24, true);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 35, true);


--
-- Name: teacher_availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teacher_availability_id_seq', 7, true);


--
-- Name: teacher_earnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teacher_earnings_id_seq', 1, false);


--
-- Name: teachers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teachers_id_seq', 11, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.units_id_seq', 21, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 43, true);


--
-- Name: admin_message_recipients admin_message_recipients_admin_message_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_message_recipients
    ADD CONSTRAINT admin_message_recipients_admin_message_id_user_id_unique UNIQUE (admin_message_id, user_id);


--
-- Name: admin_message_recipients admin_message_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_message_recipients
    ADD CONSTRAINT admin_message_recipients_pkey PRIMARY KEY (id);


--
-- Name: admin_messages admin_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: curriculum_pdfs curriculum_pdfs_level_code_lesson_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_pdfs
    ADD CONSTRAINT curriculum_pdfs_level_code_lesson_number_unique UNIQUE (level_code, lesson_number);


--
-- Name: curriculum_pdfs curriculum_pdfs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_pdfs
    ADD CONSTRAINT curriculum_pdfs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: group_class_registrations group_class_registrations_group_class_id_student_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_class_registrations
    ADD CONSTRAINT group_class_registrations_group_class_id_student_id_unique UNIQUE (group_class_id, student_id);


--
-- Name: group_class_registrations group_class_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_class_registrations
    ADD CONSTRAINT group_class_registrations_pkey PRIMARY KEY (id);


--
-- Name: group_classes group_classes_daily_room_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_classes
    ADD CONSTRAINT group_classes_daily_room_name_unique UNIQUE (daily_room_name);


--
-- Name: group_classes group_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_classes
    ADD CONSTRAINT group_classes_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: lead_remarks lead_remarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_remarks
    ADD CONSTRAINT lead_remarks_pkey PRIMARY KEY (id);


--
-- Name: leads leads_phone_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_phone_unique UNIQUE (phone);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: lesson_bookings lesson_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_bookings
    ADD CONSTRAINT lesson_bookings_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_unit_id_order_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_unit_id_order_unique UNIQUE (unit_id, "order");


--
-- Name: levels levels_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_code_unique UNIQUE (code);


--
-- Name: levels levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: notebook_entries notebook_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notebook_entries
    ADD CONSTRAINT notebook_entries_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: packages packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.packages
    ADD CONSTRAINT packages_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: payment_accounts payment_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_accounts
    ADD CONSTRAINT payment_accounts_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_lesson_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_lesson_id_unique UNIQUE (lesson_id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: session_ratings session_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_ratings
    ADD CONSTRAINT session_ratings_pkey PRIMARY KEY (id);


--
-- Name: session_ratings session_ratings_session_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_ratings
    ADD CONSTRAINT session_ratings_session_id_unique UNIQUE (session_id);


--
-- Name: session_requests session_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests
    ADD CONSTRAINT session_requests_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_daily_room_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_daily_room_name_unique UNIQUE (daily_room_name);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_unique UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: student_curriculum_assignments student_curriculum_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_curriculum_assignments
    ADD CONSTRAINT student_curriculum_assignments_pkey PRIMARY KEY (id);


--
-- Name: student_progress student_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_pkey PRIMARY KEY (id);


--
-- Name: student_progress student_progress_student_id_lesson_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_student_id_lesson_id_unique UNIQUE (student_id, lesson_id);


--
-- Name: student_units student_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_units
    ADD CONSTRAINT student_units_pkey PRIMARY KEY (id);


--
-- Name: student_units student_units_student_id_unit_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_units
    ADD CONSTRAINT student_units_student_id_unit_id_unique UNIQUE (student_id, unit_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_unique UNIQUE (user_id);


--
-- Name: subscriptions subscriptions_invoice_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_invoice_uuid_unique UNIQUE (invoice_uuid);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: teacher_availability teacher_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_availability
    ADD CONSTRAINT teacher_availability_pkey PRIMARY KEY (id);


--
-- Name: teacher_earnings teacher_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_earnings
    ADD CONSTRAINT teacher_earnings_pkey PRIMARY KEY (id);


--
-- Name: teacher_earnings teacher_earnings_session_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_earnings
    ADD CONSTRAINT teacher_earnings_session_id_unique UNIQUE (session_id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_teacher_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_teacher_code_unique UNIQUE (teacher_code);


--
-- Name: teachers teachers_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_unique UNIQUE (user_id);


--
-- Name: units units_level_id_order_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_level_id_order_unique UNIQUE (level_id, "order");


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: group_class_registrations_student_id_group_class_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX group_class_registrations_student_id_group_class_id_index ON public.group_class_registrations USING btree (student_id, group_class_id);


--
-- Name: group_classes_status_scheduled_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX group_classes_status_scheduled_at_index ON public.group_classes USING btree (status, scheduled_at);


--
-- Name: group_classes_teacher_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX group_classes_teacher_id_index ON public.group_classes USING btree (teacher_id);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: lead_remarks_lead_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_remarks_lead_id_index ON public.lead_remarks USING btree (lead_id);


--
-- Name: leads_assigned_to_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_assigned_to_index ON public.leads USING btree (assigned_to);


--
-- Name: leads_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leads_status_index ON public.leads USING btree (status);


--
-- Name: lesson_bookings_student_id_level_code_lesson_number_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_bookings_student_id_level_code_lesson_number_index ON public.lesson_bookings USING btree (student_id, level_code, lesson_number);


--
-- Name: lesson_bookings_student_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_bookings_student_id_status_index ON public.lesson_bookings USING btree (student_id, status);


--
-- Name: notebook_entries_student_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notebook_entries_student_id_created_at_index ON public.notebook_entries USING btree (student_id, created_at);


--
-- Name: notifications_notifiable_type_notifiable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_notifiable_type_notifiable_id_index ON public.notifications USING btree (notifiable_type, notifiable_id);


--
-- Name: otp_codes_phone_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX otp_codes_phone_index ON public.otp_codes USING btree (phone);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: quiz_attempts_student_id_lesson_id_passed_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_attempts_student_id_lesson_id_passed_index ON public.quiz_attempts USING btree (student_id, lesson_id, passed);


--
-- Name: quiz_attempts_student_id_quiz_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_attempts_student_id_quiz_id_index ON public.quiz_attempts USING btree (student_id, quiz_id);


--
-- Name: quiz_questions_quiz_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_questions_quiz_id_index ON public.quiz_questions USING btree (quiz_id);


--
-- Name: session_ratings_teacher_id_rating_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_ratings_teacher_id_rating_index ON public.session_ratings USING btree (teacher_id, rating);


--
-- Name: session_requests_assigned_teacher_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_requests_assigned_teacher_id_status_index ON public.session_requests USING btree (assigned_teacher_id, status);


--
-- Name: session_requests_status_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_requests_status_type_index ON public.session_requests USING btree (status, type);


--
-- Name: session_requests_student_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_requests_student_id_status_index ON public.session_requests USING btree (student_id, status);


--
-- Name: session_requests_target_teacher_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX session_requests_target_teacher_id_status_index ON public.session_requests USING btree (target_teacher_id, status);


--
-- Name: student_curriculum_assignments_student_id_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_curriculum_assignments_student_id_is_active_index ON public.student_curriculum_assignments USING btree (student_id, is_active);


--
-- Name: student_progress_student_id_lesson_id_passed_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX student_progress_student_id_lesson_id_passed_index ON public.student_progress USING btree (student_id, lesson_id, passed);


--
-- Name: subscriptions_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_status_index ON public.subscriptions USING btree (status);


--
-- Name: subscriptions_student_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_student_id_index ON public.subscriptions USING btree (student_id);


--
-- Name: teacher_availability_teacher_id_day_of_week_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX teacher_availability_teacher_id_day_of_week_is_active_index ON public.teacher_availability USING btree (teacher_id, day_of_week, is_active);


--
-- Name: teacher_earnings_teacher_id_credited_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX teacher_earnings_teacher_id_credited_at_index ON public.teacher_earnings USING btree (teacher_id, credited_at);


--
-- Name: admin_message_recipients admin_message_recipients_admin_message_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_message_recipients
    ADD CONSTRAINT admin_message_recipients_admin_message_id_foreign FOREIGN KEY (admin_message_id) REFERENCES public.admin_messages(id) ON DELETE CASCADE;


--
-- Name: admin_message_recipients admin_message_recipients_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_message_recipients
    ADD CONSTRAINT admin_message_recipients_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_messages admin_messages_sent_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_sent_by_foreign FOREIGN KEY (sent_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: curriculum_pdfs curriculum_pdfs_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_pdfs
    ADD CONSTRAINT curriculum_pdfs_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_class_registrations group_class_registrations_group_class_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_class_registrations
    ADD CONSTRAINT group_class_registrations_group_class_id_foreign FOREIGN KEY (group_class_id) REFERENCES public.group_classes(id) ON DELETE CASCADE;


--
-- Name: group_class_registrations group_class_registrations_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_class_registrations
    ADD CONSTRAINT group_class_registrations_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_classes group_classes_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_classes
    ADD CONSTRAINT group_classes_lesson_id_foreign FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: group_classes group_classes_teacher_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_classes
    ADD CONSTRAINT group_classes_teacher_id_foreign FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lead_remarks lead_remarks_lead_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_remarks
    ADD CONSTRAINT lead_remarks_lead_id_foreign FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_remarks lead_remarks_staff_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_remarks
    ADD CONSTRAINT lead_remarks_staff_id_foreign FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: leads leads_assigned_to_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_foreign FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leads leads_first_assigned_to_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_first_assigned_to_foreign FOREIGN KEY (first_assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lesson_bookings lesson_bookings_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_bookings
    ADD CONSTRAINT lesson_bookings_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lesson_bookings lesson_bookings_teacher_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_bookings
    ADD CONSTRAINT lesson_bookings_teacher_id_foreign FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lessons lessons_level_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_level_id_foreign FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_unit_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: notebook_entries notebook_entries_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notebook_entries
    ADD CONSTRAINT notebook_entries_lesson_id_foreign FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: notebook_entries notebook_entries_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notebook_entries
    ADD CONSTRAINT notebook_entries_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_lesson_id_foreign FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_quiz_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_quiz_id_foreign FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_quiz_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_foreign FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quizzes quizzes_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_lesson_id_foreign FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: session_ratings session_ratings_session_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_ratings
    ADD CONSTRAINT session_ratings_session_id_foreign FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_ratings session_ratings_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_ratings
    ADD CONSTRAINT session_ratings_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_ratings session_ratings_teacher_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_ratings
    ADD CONSTRAINT session_ratings_teacher_id_foreign FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_requests session_requests_assigned_teacher_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests
    ADD CONSTRAINT session_requests_assigned_teacher_id_foreign FOREIGN KEY (assigned_teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: session_requests session_requests_lead_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests
    ADD CONSTRAINT session_requests_lead_id_foreign FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: session_requests session_requests_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests
    ADD CONSTRAINT session_requests_lesson_id_foreign FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: session_requests session_requests_requested_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests
    ADD CONSTRAINT session_requests_requested_by_foreign FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_requests session_requests_session_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests
    ADD CONSTRAINT session_requests_session_id_foreign FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: session_requests session_requests_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests
    ADD CONSTRAINT session_requests_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: session_requests session_requests_target_teacher_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_requests
    ADD CONSTRAINT session_requests_target_teacher_id_foreign FOREIGN KEY (target_teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_lesson_id_foreign FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_teacher_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_teacher_id_foreign FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_curriculum_assignments student_curriculum_assignments_assigned_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_curriculum_assignments
    ADD CONSTRAINT student_curriculum_assignments_assigned_by_foreign FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_curriculum_assignments student_curriculum_assignments_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_curriculum_assignments
    ADD CONSTRAINT student_curriculum_assignments_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_progress student_progress_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_lesson_id_foreign FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: student_progress student_progress_quiz_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_quiz_id_foreign FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE SET NULL;


--
-- Name: student_progress student_progress_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_units student_units_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_units
    ADD CONSTRAINT student_units_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: student_units student_units_unit_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_units
    ADD CONSTRAINT student_units_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;


--
-- Name: students students_lead_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_lead_id_foreign FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: students students_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_activated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_activated_by_foreign FOREIGN KEY (activated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_approved_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_approved_by_foreign FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_current_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_current_lesson_id_foreign FOREIGN KEY (current_lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_from_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_from_lesson_id_foreign FOREIGN KEY (from_lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_package_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_package_id_foreign FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_payment_account_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_payment_account_id_foreign FOREIGN KEY (payment_account_id) REFERENCES public.payment_accounts(id) ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_student_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_student_id_foreign FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_to_lesson_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_to_lesson_id_foreign FOREIGN KEY (to_lesson_id) REFERENCES public.lessons(id) ON DELETE SET NULL;


--
-- Name: teacher_availability teacher_availability_teacher_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_availability
    ADD CONSTRAINT teacher_availability_teacher_id_foreign FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_earnings teacher_earnings_session_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_earnings
    ADD CONSTRAINT teacher_earnings_session_id_foreign FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: teacher_earnings teacher_earnings_teacher_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_earnings
    ADD CONSTRAINT teacher_earnings_teacher_id_foreign FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teachers teachers_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: units units_level_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_level_id_foreign FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Zf8UMI24YA5jgzn5UXXciVilfvGuepXsyL8FrF0kwLLsSs8Hj7RFeSzdodQMyUU

