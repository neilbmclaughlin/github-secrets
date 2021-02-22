# Github Secrets

## Usage

```
github-secrets.js put [option] [filename]

upsert repository secrets from either a file or stdin

Notes:
1: Options can also be specified in env vars prepended with 'GITHUB_SECRETS'
(e.g. GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)
2: Expected format for each input line is {key}={value}

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -a, --access-token  Github personal access token                    [required]
  -o, --owner         Github repository owner                         [required]
```

```
github-secrets.js delete [option] [filename]

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

`github-secrets put -a {access token} -o neilbmclaughlin -r github-secrets test/data/env`
`github-secrets delete -a {access token} -o neilbmclaughlin -r github-secrets test/data/env`
`cat test/data/env | github-secrets delete -a {access token} -o neilbmclaughlin -r github-secrets`
