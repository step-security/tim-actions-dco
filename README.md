[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# dco-check

Enforces Developer Certificate of Origin (DCO) compliance by validating sign-off on every commit in a pull request

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `commits` | JSON array of pull request commits to validate for DCO sign-off | `true` | — |

## Usage

Add `.github/workflows/dco.yml` with the following:

```yml
name: DCO Compliance Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  dco_check:
    runs-on: ubuntu-latest
    name: DCO Sign-off Check
    steps:
      - name: Fetch PR Commits
        id: pr-commits
        uses: tim-actions/get-pr-commits@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Validate DCO Sign-off
        uses: step-security/tim-actions-dco@v1
        with:
          commits: ${{ steps.pr-commits.outputs.commits }}
```
