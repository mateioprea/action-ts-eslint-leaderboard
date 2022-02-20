import * as core from '@actions/core'
import * as github from '@actions/github'
import {getAllScores, getPullRequestScore} from './score'
import {getAuthor, getPullRequestCommits, getWeeksCommits} from './git-commands'
// eslint-disable-next-line import/no-unresolved
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema'
import {generatePrComment} from './pull-request-comment'

async function run(): Promise<void> {
  try {
    const mainBranchName = core.getInput('mainBranchName') || 'main'

    core.info(`Input[mainBranchName] = ${core.getInput('mainBranchName')}`)
    core.info(`Parsed mainBranchName = ${mainBranchName}`)
    const githubPayload = github.context.payload as PullRequestEvent
    core.info(`Context target ref = ${githubPayload.pull_request.base.ref}`)

    const commits = await getWeeksCommits()
    core.info(`Fetched current week's commits: (${commits.length})`)

    const allScores = await getAllScores(commits)
    core.info(
      `Calculated all scores from previous week: ${
        Object.keys(allScores).length
      } authors`
    )

    const pullRequestCommits = await getPullRequestCommits(mainBranchName)
    core.info(`Fetched pull request commits: (${pullRequestCommits.length})`)

    const me = await getAuthor(pullRequestCommits[0])
    core.info(`Fetched info about current user: ${me}`)

    const pullRequestScore = await getPullRequestScore(pullRequestCommits)
    core.info(`Calculated score of current PR: ${pullRequestScore}`)

    const prComment = generatePrComment(allScores, me, pullRequestScore)

    core.setOutput('pr-comment', prComment)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
