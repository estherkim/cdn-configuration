// check if approver is in the amp-qa team

import {Octokit} from '@octokit/rest';
import yargs from 'yargs/yargs';

const {github_ref: githubRef} = yargs(process.argv.slice(2))
  .options({github_ref: {type: 'string', demandOption: true}})
  .parseSync();

const octokit = new Octokit({
  auth: process.env.ACCESS_TOKEN,
});
const pullNumber = githubRef.search(/(\d+)/g);
const params = {
  owner: 'estherkim',
  repo: 'cdn-configuration',
  pull_number: pullNumber,
};

async function main() {
  const {data: pull} = await octokit.rest.pulls.get(params);
  if (!pull.head.ref.startsWith('') || !pull.head.ref.startsWith('')) {
    // skip for other branches
    return;
  }

  // get list of approvers
  const {data: reviews} = await octokit.rest.pulls.listReviews(params);
  const approvers = reviews.map((review) => {
    if (review && review.state == 'approved' && review.user) {
      return review.user.login;
    }
  });

  // check if at least 1 approver is qa
  const {data: qas} = await octokit.teams.listMembersInOrg({
    org: 'ampproject',
    team_slug: 'amp-qa',
  });
  const approverIsQa = qas.some((qa) => approvers.includes(qa.login));
  if (approverIsQa) return;

  console.error('This pull request is missing an approval from QA');
  process.exit(1);
}

void main();
