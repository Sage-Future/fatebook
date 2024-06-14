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

These following instructions assume you're using macOS and Homebrew.

### Clone the repository

```shell
git clone https://github.com/Sage-Future/fatebook.git
cd fatebook
cp .env.example .env
```

### Create TLS certificate for localhost

```shell
brew install mkcert
mkcert -install
mkcert localhost
```

### Set up the database

```shell
brew install postgresql@15
# Or download and install from https://www.postgresql.org/download
# If you do this, follow the instructions there for starting the database.

# If you're using Bash rather than Z shell, substitute `~/.bash_profile` for
# `~/.zshrc` in the following commands.
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
. ~/.zshrc

# Start postgres
LC_ALL="C" /opt/homebrew/opt/postgresql@15/bin/postgres -D /opt/homebrew/var/postgresql@15
```

Open a new terminal window and run the following commands:

```shell
# create `fatebook` role
createuser fatebook

# create `fatebook_development` database, owned by the `fatebook` user
createdb fatebook_development --owner fatebook
```

1. In `.env` add the following lines:
   ```bash
   DATABASE_URL='postgresql://fatebook:postgres@localhost:5432/fatebook_development'
   DATABASE_DIRECT_URL='postgresql://fatebook:postgres@localhost:5432/fatebook_development'
   ```
2. Run `npm install` to install dependencies.
3. Run `npm run vercel-build` to set up the Fatebook schema.

### Start the server

1. Run `npm run dev`.
2. Go to https://localhost:3000. You should be able to sign in and create predictions.

### Addendum

If you want to make or test changes to the Slack integration, you'll need to set up a Slack app. This is more involved - [get in touch](https://github.com/Sage-Future/fatebook/issues) and we'll help you get up and running.

<details>
  <summary>Optional extra step: Or set up your own Google OAuth credentials</summary>

Your `.env.example` is prefilled with the shared Fatebook developer Google OAuth credentials. If you'd like to create your own (e.g., to change the configuration), follow these steps:

1. Go to https://console.cloud.google.com/apis/credentials.
2. Click <kbd>Configure a project</kbd>. (Or, if you've previously made a project, click <kbd>Your project</kbd> -> <kbd>New project</kbd> -> Select your new project)
3. Click <kbd>CREATE CREDENTIALS</kbd>.
4. Select `OAuth client ID`.
5. You may need to follow the instructions in "Create consent screen" - select all non-sensitive scopes. Then try 3-4 again.
6. For `Application type` select `Web application`.
7. Under `Name` type something like `Fatebook development`.
8. Under `Authorized redirect URIs`, click <kbd>ADD URI</kbd> and under `URIs 1` type `https://localhost:3000/api/auth/callback/google`.
9. Open the `.env` file in the root of the `fatebook` repository. Copy and paste the `Client ID` value after `GOOGLE_CLIENT_ID=` in `fatebook/.env`, and do the same for `Client secret` and `GOOGLE_CLIENT_SECRET=`.
</details>

If you have any problems, [let us know](https://github.com/Sage-Future/fatebook/issues)!
