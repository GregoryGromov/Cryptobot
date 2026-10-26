-- ROLE=migrate applies this after every migration; grant this NOLOGIN role to the service login.
-- The service login must not own application tables or inherit the migration role.
-- A migrator without superuser needs membership in reinforce_runtime and a pgboss schema the runtime already owns:
-- changing a schema's owner requires CREATE on the database for the new owner.
DO $$
DECLARE item record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'reinforce_runtime') THEN
    CREATE ROLE reinforce_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
  FOR item IN SELECT nspname FROM pg_namespace WHERE nspname IN
    ('account','broker','market','runtime','forecast','trading','conversation','telemetry') LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO reinforce_runtime', item.nspname);
    EXECUTE format('REVOKE CREATE ON SCHEMA %I FROM reinforce_runtime', item.nspname);
  END LOOP;
  FOR item IN SELECT n.nspname, c.relname, EXISTS (
    SELECT 1 FROM pg_trigger t WHERE t.tgrelid = c.oid AND t.tgname = 'immutable_fact'
  ) AS immutable FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname IN ('account','broker','market','runtime','forecast','trading','conversation','telemetry') LOOP
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM reinforce_runtime', item.nspname, item.relname);
    EXECUTE format('GRANT SELECT, INSERT ON TABLE %I.%I TO reinforce_runtime', item.nspname, item.relname);
    IF NOT item.immutable THEN
      EXECUTE format('GRANT UPDATE, DELETE ON TABLE %I.%I TO reinforce_runtime', item.nspname, item.relname);
    END IF;
  END LOOP;
  -- pg-boss maintains its own queue relations. Ownership is confined to that schema.
  ALTER SCHEMA pgboss OWNER TO reinforce_runtime;
  FOR item IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'pgboss' AND c.relkind IN ('r', 'p', 'S', 'v', 'm') LOOP
    EXECUTE format('ALTER %s pgboss.%I OWNER TO reinforce_runtime',
      CASE (SELECT relkind FROM pg_class WHERE oid = format('pgboss.%I', item.relname)::regclass)
        WHEN 'S' THEN 'SEQUENCE' WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' ELSE 'TABLE' END, item.relname);
  END LOOP;
  FOR item IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'pgboss' LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO reinforce_runtime', item.signature);
  END LOOP;
END;
$$;
