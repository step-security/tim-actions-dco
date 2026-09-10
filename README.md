[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# step-security/tim-actions-dco

Enforces Developer Certificate of Origin (DCO) compliance by validating sign-off on every commit in a pull request

## Table of Contents

- [Inputs](#inputs)
- [Usage](#usage)

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `commits` | JSON array of pull request commits to validate for DCO sign-off | `true` | — |

## Usage

Create a workflow file in your repository under `.github/workflows/` and paste the configuration below to start enforcing DCO sign-off on every pull request.

```yml
name: Enforce DCO

on:
  pull_request:
    branches:
      - main
    types: [opened, synchronize, reopened, edited]

jobs:
  verify_dco:
    runs-on: ubuntu-latest
    name: Verify DCO Sign-off
    permissions:
      pull-requests: read
    steps:
      - name: Collect PR Commits
        id: collect-commits
        uses: tim-actions/get-pr-commits@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Check DCO Sign-off
        uses: step-security/tim-actions-dco@v1
        with:
          commits: ${{ steps.collect-commits.outputs.commits }}
```
