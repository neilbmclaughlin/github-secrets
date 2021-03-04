![CI](https://github.com/neilbmclaughlin/github-secrets/actions/workflows/ci.yml/badge.svg)
![NPM Publish](https://github.com/neilbmclaughlin/github-secrets/actions/workflows/npm-publish.yml/badge.svg)
[![NPM Version](https://badge.fury.io/js/%40neilbmclaughlin%2Fgithub-secrets.svg)](https://badge.fury.io/js/%40neilbmclaughlin%2Fgithub-secrets)

# Github Secrets

A CLI utility to populate github secrets from a line based text file or stream 

***Note***: The [Github CLI](https://cli.github.com/) now supports secret creation and should be used instead.


## Installation

`npm install -g @neilbmclaughlin/github-secrets`

## Usage

```
❯ github-secrets --help
github-secrets <cmd> [options]

Commands:
  github-secrets put [filename]     upsert repository secrets from either a file or stdin
  github-secrets delete [filename]  delete repository secrets from either a file or stdin

Options:
  --help     Show help            [boolean]
  --version  Show version number  [boolean]

Examples:
  Put secrets from a file of space separated name-value pairs:
  github-secrets put -a {token} -o {owner} -r {repo} test/data/env2
  Put a single secret:
  echo "foo bar" | github-secrets put -a {token} -o {owner} -r {repo}
  Put secrets from an .env format file with comments filtered out:
  egrep -v '^[ ]*#' test/data/env | github-secrets put -a {token} -o {owner} -r {repo} -s= test/data/env
  Delete secrets from a file:
  cut -f1 -d' ' test/data/env2 | github-secrets delete -a {access} -o {owner} -r {repo}
  Put secrets from a URL (which should not be public!):
  curl -s https://raw.githubusercontent.com/neilbmclaughlin/github-secrets/main/test/data/env2 | github-secrets put -a {token} -o {owner} -r {repo}

Options can also be specified in env vars prepended with 'GITHUB_SECRETS' (e.g. GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)

```
### Put Secrets
```
❯ github-secrets put --help
github-secrets put [filename]

upsert repository secrets from either a file or stdin

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -s, --separator     key-value pair separator                    [default: " "]
  -a, --access-token  Github personal access token                    [required]
  -o, --owner         Github repository owner (defaults to access token owner)
  -r, --repository    Github repository
❯
```

### Delete Secrets
```
❯ github-secrets delete --help
github-secrets delete [filename]

delete repository secrets from either a file or stdin

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -a, --access-token  Github personal access token                    [required]
  -o, --owner         Github repository owner (defaults to access token owner)
  -r, --repository    Github repository
```
