import * as path from 'path';

export const TEST_USERS = {
  regular: {
    email: 'e2e.user@test.edu',
    password: 'E2EPassword123',
    roleid: 2,
    name: 'E2E Regular User',
  },
  admin: {
    email: 'e2e.admin@test.edu',
    password: 'E2EAdmin123',
    roleid: 1,
    name: 'E2E System Admin',
  },
  pending: {
    email: 'e2e.pending@test.edu',
    password: 'E2EPending123',
  },
  disabled: {
    email: 'e2e.disabled@test.edu',
    password: 'E2EDisabled123',
  },
} as const;

export const TEST_INSTITUTION_ID = '9999';

export const SAMPLE_PDF_PATH = path.join(__dirname, 'sample-certificate.pdf');

export const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:5001/api';
