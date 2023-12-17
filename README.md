# [Fatebook](https://fatebook.io)

The fastest way to make and track predictions.

This repo includes [fatebook.io](https://fatebook.io), [Fatebook for Slack](fatebook.io/for-slack) and [Fatebook for Chrome](https://fatebook.io/extension).

You can report bugs in the [Issues](https://github.com/Sage-Future/fatebook/issues) tab. You can make feature requests there or in our [Discord](https://discord.gg/mt9YVB8VDE).

## Tech stack

- Prisma
- Next.js
- Vercel
- Slack API
- TRPC
- Tailwind

## Contributing

If you're interested in contributing, [let us know](https://github.com/Sage-Future/fatebook/issues), and we can help you get up and running - thank you!

These following instructions assume you're using macOS, Homebrew, and Bash.

### Clone the repository

```shell
git clone git@github.com:Sage-Future/fatebook.git
cd fatebook
cp .env.example .env
```

### Set up authentication with Google

1. Go to https://console.cloud.google.com/apis/credentials.
2. Click <kbd>Configure a project</kbd>.
3. Click <kbd>CREATE CREDENTIALS</kbd>.
4. Select `OAuth client ID`.
5. For `Application type` select `Web application`.
6. Under `Name` type something like `Fatebook development`.
7. Under `Authorized redirect URIs`, click <kbd>ADD URI</kbd> and under `URIs 1` type `https://localhost:3000/api/auth/callback/google`.
8. Open the `.env` file in the root of the `fatebook` repository. Copy and paste the `Client ID` value after `GOOGLE_CLIENT_ID=` in `fatebook/.env`, and do the same for `Client secret` and `GOOGLE_CLIENT_SECRET=`.

### Create TLS certificate for localhost

```shell
brew install mkcert
mkcert -install
mkcert localhost
```

### Set up the database

```shell
brew install postgresql@16 # not sure if this is the correct version

# If you're using Z shell rather than Bash, substitute `~/.zshrc` for
# `~/.bash_profile` in the following commands.
echo 'export PATH="/usr/local/opt/postgresql@16/bin:$PATH"' >> ~/.bash_profile
. ~/.bash_profile

pg_ctl -D /usr/local/var/postgresql@16 start # start Postgres
createuser fatebook # create `fatebook` role
createdb fatebook_development --owner fatebook # create `fatebook_development` database, owned by the `fatebook` user
```

1. In `.env` add the following lines:
   ```bash
   DATABASE_URL='postgresql://fatebook:postgres@localhost:5432/fatebook_development'
   DATABASE_DIRECT_URL='postgresql://fatebook:postgres@localhost:5432/fatebook_development'
   ```
2. Run `npm install` to install dependencies.
3. Run `npm run vercel-build` to set up the Fatebook schema.

### Start the server

1. In separate terminal windows, run `npm run dev`.
2. Go to https://localhost:3000. You should be able to sign in and create predictions.

If you have any problems, [let us know](https://github.com/Sage-Future/fatebook/issues)!
