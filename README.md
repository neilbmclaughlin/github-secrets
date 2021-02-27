# Github Secrets

A utility to populate github secrets from the CLI

Note: version 2.0.0 is a breaking change and no longer works by default with .env format files.
See examples below on how to do this in a unix environment

## Usage

### Put Secrets
```
github-secrets put [filename]

upsert repository secrets from either a file or stdin

Notes:
1: Options can also be specified in env vars prepended with 'GITHUB_SECRETS'
(e.g. GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)
2: Expected format for each input line is {key}={value}

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -s, --separator     key-value pair separator                    [default: " "]
  -a, --access-token  Github personal access token                    [required]
  -o, --owner         Github repository owner                         [required]
  -r, --repository    Github repository

```

## Delete Secrets
```
github-secrets delete [filename]

delete repository secrets from either a file or stdin

Notes:
1: Options can also be specified in env vars prepended with 'GITHUB_SECRETS'
(e.g. GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)
2: Expected format for each input line is {key}={value}

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -a, --access-token  Github personal access token                    [required]
  -o, --owner         Github repository owner                         [required]
  -r, --repository    Github repository
```

## Examples

Putting from a file of key value pairs separated by ' ':
`github-secrets put -a {access-token} -o {org|user} -r {repo} test/data/env2`^

Putting from an .env format file with comments filtered out:
`egrep -v '^[ ]*#' test/data/env | github-secrets put -s '=' [options]`

Putting an .env format file from a URL with comments filtered out:
`curl -s https://raw.githubusercontent.com/neilbmclaughlin/github-secrets/main/test/data/env | egrep -v '^[ ]*#' | sed 's/=/ /' | github-secrets put -s '=' [options]`

Deleting from an .env file with comments filtered:
`egrep -v '^[ ]*#' test/data/env | cut -f1 -d= |  github-secrets delete [options]`

