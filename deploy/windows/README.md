# Deploying Cilbs to a Windows VM

> These scripts were written and reviewed against the documented behaviour of
> NSSM, Caddy, and `pg_dump`, but they have not been executed on a Windows
> machine — this repository was developed on macOS. Expect to adjust a path.

A runbook for a Windows Server box you reach over RDP. It ends with the app on
your own domain over HTTPS, with real accounts, restarting by itself after a
reboot, and backing itself up.

The database lives on the same machine, which is why this route costs nothing
beyond the VM itself.

---

## 1. Install the pieces

From an **Administrator** PowerShell:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install PostgreSQL.PostgreSQL.16
winget install NSSM.NSSM
winget install CaddyServer.Caddy
```

Package IDs do drift. If one of those is rejected, find the current name with
`winget search postgres` (or `nssm`, `caddy`) and use the ID it prints.

Close and reopen PowerShell so the new PATH entries take effect, then confirm:

```powershell
node --version    # v20 or newer
psql --version
```

If `psql` isn't found, add PostgreSQL's `bin` folder (for example
`C:\Program Files\PostgreSQL\16\bin`) to the system PATH.

## 2. Create the database

```powershell
$env:PGPASSWORD = "<the postgres superuser password you set during install>"
psql -U postgres -c "CREATE USER cilbs WITH PASSWORD 'pick-a-strong-one';"
psql -U postgres -c "CREATE DATABASE cilbs OWNER cilbs;"
```

## 3. Get the code and build it

```powershell
git clone https://github.com/unknownentity19/Cilbs.git C:\cilbs
cd C:\cilbs
npm ci
```

Create `C:\cilbs\.env.local`:

```ini
DATABASE_URL=postgresql://cilbs:pick-a-strong-one@127.0.0.1:5432/cilbs
AUTH_SECRET=<paste the value generated below>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Generate the secret (Windows has no `openssl` by default):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Then create the tables and build:

```powershell
npm run db:migrate
npm run build
```

> **`NEXT_PUBLIC_SITE_URL` is baked in at build time.** It is the one variable
> that is *not* read when the server starts, so changing it later means running
> `npm run build` again. Everything else in `.env.local` is read at startup.

## 4. Run it as a service

```powershell
.\deploy\windows\install-service.ps1 -ProjectPath C:\cilbs
```

It listens on `127.0.0.1:3000` deliberately — nothing should reach it except
the reverse proxy. Check it:

```powershell
Invoke-WebRequest http://127.0.0.1:3000 -UseBasicParsing | Select-Object StatusCode
Get-Content C:\cilbs\logs\cilbs.err.log -Tail 20
```

Useful afterwards: `nssm restart Cilbs`, `nssm stop Cilbs`,
`nssm edit Cilbs`.

## 5. Put HTTPS in front of it

Point your domain's A record at the VM's public IP, and open **80 and 443** in
both the Windows Firewall and your provider's network firewall. Port 80 has to
be reachable — that is how the certificate is issued.

```powershell
New-NetFirewallRule -DisplayName "HTTP"  -Direction Inbound -LocalPort 80  -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

Edit `deploy\windows\Caddyfile` to your domain, then:

```powershell
cd C:\cilbs\deploy\windows
caddy run --config Caddyfile
```

Once that works, install Caddy as a service too so it starts with the machine:

```powershell
nssm install Caddy "C:\Program Files\Caddy\caddy.exe" "run --config C:\cilbs\deploy\windows\Caddyfile"
nssm set Caddy Start SERVICE_AUTO_START
nssm start Caddy
```

Sign-in **only works over HTTPS** — session cookies are marked `Secure`, so a
plain-HTTP origin silently fails to keep you logged in.

## 6. Turn on backups

A local Postgres is unreachable from GitHub Actions, so the repository's backup
workflow doesn't apply here. Use the local equivalent:

```powershell
.\deploy\windows\backup.ps1 -Password "pick-a-strong-one"
```

Then schedule it daily — the command is in the comments at the top of
`backup.ps1`. Restore-test one dump before you rely on it.

## 7. Check it over

- `https://your-domain.com` loads, and the padlock is real.
- `/signup` creates an account and lands on the dashboard.
- Sign out, then `/signin` gets you back in.
- `/studio` says **"Saved to your account"**, and a row appears:
  `psql -U cilbs -d cilbs -c "select name, updated_at from workflow;"`
- `/sitemap.xml` shows your domain, not `localhost`.

## Updating later

```powershell
cd C:\cilbs
git pull
npm ci
npm run db:migrate    # only if the schema changed
npm run build
nssm restart Cilbs
```

## If sign-in misbehaves

Almost always one of three things:

1. **The proxy isn't forwarding headers.** Auth.js builds callback URLs from
   `X-Forwarded-Host` and `X-Forwarded-Proto`. Caddy sets both; a hand-rolled
   IIS rewrite often doesn't.
2. **You're on plain HTTP.** The session cookie is `Secure`; it will not stick.
3. **`NEXT_PUBLIC_SITE_URL` is stale.** It is compiled in — rebuild after
   changing it.
