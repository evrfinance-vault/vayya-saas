[![Netlify Status](https://api.netlify.com/api/v1/badges/c4cbb751-06b3-4833-9680-a02cecd6cc37/deploy-status)](https://app.netlify.com/projects/dreamy-belekoy-28dd11/deploys)

# 🔒 Kayya SaaS

Financial SaaS for borrowers and small business owners.

## Hey Developers!

We use [git-flow](https://github.com/nvie/gitflow) around these parts. It's a scalable Git branching model.

[Read more about it here.](https://jeffkreeftmeijer.com/git-flow/)

### Developing New Features

Use git-flow to start working on a new feature:

```bash
git flow feature start FEATURE_NAME
```

When you're done, use git-flow to indicate that you're finished:

```bash
git flow feature finish FEATURE_NAME
```

Continue in this manner until you're ready to deploy! See [Deploying to Production](#deploying-to-production) below for deploy instructions.

## Getting Started

1. Install Node 24+
2. Install dependencies
3. Set up the database
4. Run the apps!

```bash
# install Node 24+
brew install node

# install dependencies
npm install

# set up the database
npm run -w apps/backend prisma:generate
npm run -w apps/backend db:push
npm run -w apps/backend db:seed

# run the apps!
npm run dev
```

### Running Individual Apps

You can also run a single app (or the backend):

```bash
npm run dev:backend
npm run dev:admin
npm run dev:borrower
npm run dev:owner
```

## Linting and More

```bash
npm run lint # check only
npm run lint:fix

npm run prettier # check only
npm run prettier:write

npm run typecheck
```

## Running Tests

```bash
npm run test
```

## Clean Installs

```bash
# option 1
npm run ci

# option 2
npm run clean
npm install
```

## Build for Deploys

This is just for sanity checks. Builds auto-deploy to Netlify.

```bash
npm run build
```

## Deploying to Production

Deploys are handled automatically. Use git-flow (or the `release.sh` script) to create a new release. This will automatically tag a new version and deploy to Netlify.

### Using the Release Script

When you're ready to deploy a new release, you can run `release.sh` in the project root:

```bash
# see what will happen without doing anything
DRY_RUN=1 npm run release -- 1.0.0

# actually do the release
npm run release -- 1.0.0
```
