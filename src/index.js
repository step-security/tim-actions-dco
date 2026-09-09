const core = require('@actions/core')
const github = require('@actions/github')
const validator = require('email-validator')
const { validateSubscription } = require('./subscription')

function parseSignoffLines(commit) {
  const pattern = /^Signed-off-by: (.*) <(.*)>$/img
  return [...commit.message.matchAll(pattern)].map(m => ({ name: m[1], email: m[2] }))
}

function shouldSkipCommit(commit, author, parents, requiresSignoff) {
  if (parents && parents.length > 1) return true
  if (!requiresSignoff && commit.verification.verified) return true
  if (author && author.type === 'Bot') return true
  return false
}

function createCommitRecord(sha, prURL, commit) {
  return {
    sha,
    url: `${prURL}/commits/${sha}`,
    author: commit.author.name,
    committer: commit.committer.name,
    message: ''
  }
}

function getMissingSignoffMessage(commit, requiresSignoff) {
  if (requiresSignoff) return `The sign-off is missing.`
  if (!commit.verification.verified) return `Commit by organization member is not verified.`
  return null
}

function resolveSignoffViolation(record, commit, signoffEntries, authorNames, authorEmails) {
  if (signoffEntries.length === 1) {
    const entry = signoffEntries[0]
    if (!authorNames.includes(entry.name.toLowerCase()) || !authorEmails.includes(entry.email.toLowerCase())) {
      record.message = `Expected "${commit.author.name} <${commit.author.email}>", but got "${entry.name} <${entry.email}>".`
      return record
    }
    return null
  }

  const matchingSignoffs = signoffEntries.filter(
    s => authorNames.includes(s.name.toLowerCase()) && authorEmails.includes(s.email.toLowerCase())
  )
  if (matchingSignoffs.length === 0) {
    const got = signoffEntries.map(s => `"${s.name} <${s.email}>"`).join(', ')
    record.message = `Can not find "${commit.author.name} <${commit.author.email}>", in [${got}].`
    return record
  }
  return null
}

function buildFailureReport(violations) {
  const commitLines = violations.map(v => `  ${v.sha}    ${v.message}`)
  return `The SoB (DCO) check failed

${commitLines.join('\n')}

  What should I do to fix it ?

  All proposed commits should include a Signed-off-by: <your-name> <your-email-address> line in their commit message.
  This is most conveniently done by using --signoff (-s) when running git commit.`
}

async function verifyDcoCompliance(commits, isRequiredFor, prURL) {
  const violations = []

  for (const { commit, author, parents, sha } of commits) {
    const requiresSignoff = !author || await isRequiredFor(author.login)
    if (shouldSkipCommit(commit, author, parents, requiresSignoff)) continue

    const record = createCommitRecord(sha, prURL, commit)
    const signoffEntries = parseSignoffLines(commit)

    if (signoffEntries.length === 0) {
      const message = getMissingSignoffMessage(commit, requiresSignoff)
      if (message) {
        record.message = message
        violations.push(record)
      }
      continue
    }

    const email = commit.author.email || commit.committer.email
    if (!validator.validate(email)) {
      record.message = `${email} is not a valid email address.`
      violations.push(record)
      continue
    }

    const authorNames = [commit.author.name.toLowerCase(), commit.committer.name.toLowerCase()]
    const authorEmails = [commit.author.email.toLowerCase(), commit.committer.email.toLowerCase()]

    const violation = resolveSignoffViolation(record, commit, signoffEntries, authorNames, authorEmails)
    if (violation) violations.push(violation)
  }

  return violations
}

async function run() {
  try {
    await validateSubscription()

    const { payload: { pull_request: pr } } = github.context
    const commitsString = core.getInput('commits')
    const commits = JSON.parse(commitsString)

    const dcoViolations = await verifyDcoCompliance(commits, () => true, pr.html_url)
    if (dcoViolations.length === 0) return

    const failureReport = buildFailureReport(dcoViolations)
    core.setFailed(failureReport)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
