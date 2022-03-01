// check if approver is in the amp-qa team

import {Octokit} from '@octokit/rest';
import yargs from 'yargs/yargs';

const {pull_number} = yargs(process.argv.slice(2))
  .options({pull_number: {type: 'number', demandOption: true}})
  .parseSync();

const octokit = new Octokit({
  auth: process.env.ACCESS_TOKEN,
});

const params = {
  owner: 'estherkim',
  repo: 'cdn-configuration',
  pull_number,
};

async function main() {
  const {data: pull} = await octokit.rest.pulls.get(params);
  console.log(pull.head.ref);
  if (!pull.head.ref.startsWith('promote-job-1') && !pull.head.ref.startsWith('promote-job-2')) {
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
