# Github Secrets

## Usage

github-secrets put [option] <filename>

upsert repository secrets from a file

Note: Options can also be specified in env vars prepended with 'GITHUB_SECRETS'
(e.g. GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -a, --access-token  Github personal access token                    [required]
  -o, --owner         Github repository owner                         [required]
  -r, --repository    Github repository

github-secrets delete [option] <filename>

delete repository secrets from a file list

Note: Options can also be specified in env vars prepended with 'GITHUB_SECRETS'
(e.g. GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)

Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
  -a, --access-token  Github personal access token                    [required]
  -o, --owner         Github repository owner                         [required]
  -r, --repository    Github repository

## Example

`github-secrets put -a {access token} -o neilbmclaughlin -r github-secrets test-data/test-env`
