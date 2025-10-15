[![Netlify Status](https://api.netlify.com/api/v1/badges/c4cbb751-06b3-4833-9680-a02cecd6cc37/deploy-status)](https://app.netlify.com/projects/dreamy-belekoy-28dd11/deploys)

# 🔒 Kayya SaaS

Financial SaaS for borrowers and small business owners.

## Hey Developers!

We use [git-flow](https://github.com/nvie/gitflow) around these parts. It's a scalable Git branching model.

[Read more about it here.](https://jeffkreeftmeijer.com/git-flow/)

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

Deploys are handled automatically. Use Git Flow (or the `release.sh` script) to create a new release. This will automatically tag a new version and deploy to Netlify.
