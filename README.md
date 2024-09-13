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

# Follow the instructions that the installer provides on how to add postgresql@15 to your PATH.
# For example, on some systems it will tell you to do this:
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
. ~/.zshrc

# If you're using Bash rather than Z shell, substitute `~/.bash_profile` for
# `~/.zshrc` in the previous commands.

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

1. Run `npm install` to install dependencies.
2. Run `npm run vercel-build` to set up the Fatebook schema.

### Start the server

1. Run `npm run dev`.
2. Go to https://localhost:3000. You should be able to sign in and create predictions.

### Running tests

Run jest tests with `npm run test`.

You can also generate a coverage report by running `npm run test -- --coverage`, the report will be printed to the console and also saved in the `coverage/` directory. The best way to view it is in the html format under `coverage/lcov-report/index.html` (run `open coverage/lcov-report/index.html`).

### Developing the Fatebook browser extension

Fatebook has a Chrome and Firefox [extension](https://fatebook.io/extension). The source is in [/chrome-extension](https://github.com/Sage-Future/fatebook/tree/main/chrome-extension)

To test changes to the Chrome extension:

1. Follow the general Fatebook dev setup steps above
2. In `after.js`, make sure `extensionInfo.isDev = true`
3. `npm run dev`, and check that your dev server is running at https://localhost:3000
4. Go to `chrome://extensions`
5. Disable the prod Fatebook extension, if you have it installed
6. "Load unpacked", and select the chrome-extension directory
7. In `chrome://extensions/shortcuts`, set the shortcut for "Make a new prediction" to Cmd-Shift-F, if it's not already set
8. Before committing, make sure `extensionInfo.isDev = false` in `after.js`

If you make a change to the contents of a file in `chrome-extension`, to see the changes in your browser you'll need to reload the extension:

1. Go to `chrome://extensions`
2. Click the refresh button next to the unpacked version of Fatebook for Chrome
3. Refresh any tabs where you want to test the extension

Changes to Fatebook itself (e.g. changes to `/pages/embed/q/[id].tsx`) will be reflected without needing to reload the extension.

<details>
  <summary>Deploying updates to the Chrome extension</summary>

Contributors - a maintainer will test and deploy your changes.

Instructions for maintainers:

1. Test changes locally in Chrome and Firefox
2. Set `extensionInfo.isDev = false` in `after.js`
3. Deploy any changes to fatebook.io, and test your local unpacked extension with the prod environment
4. Increment the `version` field in `manifest.json`
5. Run `npm run zip`
6. Upload the Chrome extension to the webstore and the Firefox version to Mozilla addons. Approval normally takes <24 hours

</details>

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
