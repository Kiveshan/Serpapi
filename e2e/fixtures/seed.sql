-- E2E test seed — idempotent, safe to run multiple times
-- DO NOT run against production. These are test-only personas.

-- Test institution (high instid to avoid collision with real data)
INSERT INTO institution (instid, institution, region, country)
VALUES (9999, 'E2E Test University', 'Test Region', 'Testland')
ON CONFLICT (instid) DO NOTHING;

-- User 1: Approved regular user (roleid=2)
-- Password: E2EPassword123
INSERT INTO user_table (fullname, institutionid, institutionemail, password, roleid, certificatelink, otherinstitution, enabled, status, dateentered)
VALUES (
  'E2E Regular User',
  9999,
  'e2e.user@test.edu',
  '$2b$12$93WLlECGR.FVNXHfMatvEe/4qm60dskMA/tmGFOPNnbRJ.eQUh6yu',
  2,
  NULL,
  NULL,
  true,
  'approved',
  CURRENT_DATE
)
ON CONFLICT (institutionemail) DO NOTHING;

-- User 2: System Admin (roleid=1)
-- Password: E2EAdmin123
INSERT INTO user_table (fullname, institutionid, institutionemail, password, roleid, certificatelink, otherinstitution, enabled, status, dateentered)
VALUES (
  'E2E System Admin',
  9999,
  'e2e.admin@test.edu',
  '$2b$12$0yhTUWUBkxdww1l.1aSHJe0u8rSjyKJOg6YVEUU07YrTdLT9F2dC2',
  1,
  NULL,
  NULL,
  true,
  'approved',
  CURRENT_DATE
)
ON CONFLICT (institutionemail) DO NOTHING;

-- User 3: Pending (registered but not yet approved)
-- Password: E2EPending123
INSERT INTO user_table (fullname, institutionid, institutionemail, password, roleid, certificatelink, otherinstitution, enabled, status, dateentered)
VALUES (
  'E2E Pending User',
  9999,
  'e2e.pending@test.edu',
  '$2b$12$KJ/3ufp36lpfH0csYIRU0uTYSouaknh8otf/5klwpJayNln0doMI6',
  2,
  NULL,
  NULL,
  false,
  'pending',
  CURRENT_DATE
)
ON CONFLICT (institutionemail) DO NOTHING;

-- User 4: Disabled (was approved, then administratively disabled)
-- Password: E2EDisabled123
INSERT INTO user_table (fullname, institutionid, institutionemail, password, roleid, certificatelink, otherinstitution, enabled, status, dateentered)
VALUES (
  'E2E Disabled User',
  9999,
  'e2e.disabled@test.edu',
  '$2b$12$11kxfrUy3R5v.bE/uRDrh.mERzt/GMb.MYBUUcgQG.Nd1rGIu8Ll2',
  2,
  NULL,
  NULL,
  false,
  'approved',
  CURRENT_DATE
)
ON CONFLICT (institutionemail) DO NOTHING
