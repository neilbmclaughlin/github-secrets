# Github Secrets

A CLI utility to populate github secrets from a line based text file or stream 

***Note***: version 2.0.0 is a breaking change and no longer works by default with .env format files.
See examples below on how to do this in a unix environment

## Usage

```
❯ github-secrets --help
github-secrets.js <cmd> [options]

Commands:
  github-secrets put [filename]     upsert repository secrets from either a
                                       file or stdin
  github-secrets delete [filename]  delete repository secrets from either a
                                       file or stdin

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

Options can also be specified in env vars prepended with 'GITHUB_SECRETS' (e.g.
GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)

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

## Examples

Putting from a file of key value pairs separated by ' ':
```
github-secrets put -a {access-token} -o {org|user} -r {repo} test/data/env2
```

Putting from an .env format file with comments filtered out:
```
egrep -v '^[ ]*#' test/data/env | \
github-secrets put -a {access-token} -o {org|user} -r {repo} -s '='
```

Putting an .env format file from a URL with comments filtered out:
```
curl -s https://raw.githubusercontent.com/neilbmclaughlin/github-secrets/main/test/data/env | \
egrep -v '^[ ]*#' | \
sed 's/=/ /' | \
github-secrets put -a {access-token} -o {org|user} -r {repo} -s '='
```

Deleting from an .env file with comments filtered:

```
egrep -v '^[ ]*#' test/data/env | \
cut -f1 -d= | \
github-secrets delete -a {access-token} -o {org|user} -r {repo}
```
