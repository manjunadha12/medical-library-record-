# SecureMed Share

A React and Express application for encrypted medical records, clinician requests, patient-controlled access, integrity verification, and access history. MongoDB stores accounts, record metadata, consents, and audit entries. The server stores encrypted report files on a persistent volume.

## Run locally

1. Install Node.js 22 or newer and start a persistent MongoDB instance.
2. Copy `backend/.env.example` to `backend/.env`. Set the MongoDB URI and generate a different value for each of `JWT_SECRET`, `COOKIE_SECRET`, and `MASTER_ENCRYPTION_KEY`. Run the following command separately for each value.

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Install the locked dependencies, build the frontend, and start the integrated server.

   ```sh
   npm ci --prefix frontend
   npm ci --prefix backend
   npm run frontend:build
   npm run backend
   ```

4. Open [http://127.0.0.1:5000](http://127.0.0.1:5000). In local development without SMTP, the server console shows messages for email verification, OTP, and password reset. Use synthetic data in development.

To initialize an administrator, supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` as temporary environment variables and run `npm run create-admin`. Use at least 12 characters and at most 72 bytes for the password. The command creates an administrator or updates the account for that email.

## Deploy with Docker Compose

1. Configure a private, authenticated MongoDB deployment reachable by the app container. Use its connection string in `backend/.env`. Use a new database for a fresh installation.
2. Set `CLIENT_URL` to the exact public HTTPS origin, for example `https://records.example.org`. Specify a working SMTP host, user, password, and sender address. Use provider-managed secrets or keep the environment file readable only by the deployment operator. Keep `TRUST_PROXY_HOPS=0` for a direct server connection, or set it to the number of trusted proxy hops in front of the server. With a single same-host HTTPS reverse proxy, use `1` and keep port 5000 bound to loopback.
3. From the project directory run `docker compose up -d --build`. Configure the HTTPS reverse proxy to forward all paths to `http://127.0.0.1:5000`. Check `/api/health` through the public origin. This endpoint returns 503 if MongoDB disconnects.
4. Bootstrap the admin with `docker compose exec -e ADMIN_EMAIL -e ADMIN_PASSWORD app npm run create-admin` using temporary environment variables in the invoking shell. Register a patient and a doctor, verify email delivery, and use the administrator dashboard to approve the doctor's credentials.
5. Using synthetic files on that host, verify the upload, sharing, integrity, and revocation flows before onboarding users.

Deploy as a single application instance with the provided volumes. Back up MongoDB, encrypted uploads, signing keys, and the master encryption key together. Keep the signing and encryption keys stable across restarts. Existing encrypted data requires the corresponding original encryption key and files, and existing signatures require the original public signing key. The archive supplies fresh deployment source and template configuration.

## Follow the record workflow

- **Patient** → Upload record → Record details → Share with doctor or verify integrity. Use **Access requests** to act on incoming requests and **Sharing permissions** to revoke access.
- **Doctor** → Access requests → Request a report from a patient. After approval, use **Shared records** to open it and check its integrity. A view-only grant disables downloads through the application.
- **Administrator** → Overview → Review doctor registrations, account status, and system events.
- **Audit history** shows access activity available to the signed-in role. **Notifications** connects users to requests, records, or the dashboard.

## Tests

`npm test` runs the cryptography checks. To run the legacy workflow suite, configure a disposable MongoDB database, set `ALLOW_TEST_SEED=true` for `npm run seed`, then run `npm run test:e2e`. The seed command clears the configured test database collections and is blocked in production.
