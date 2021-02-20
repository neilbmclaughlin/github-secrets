function getSecretsPath (owner, repository) {
  const [path, parameters] = repository
    ? ['/repos/{owner}/{repository}/actions/secrets', { owner, repository }]
    : ['/orgs/{owner}/actions/secrets', { owner }]
  return { path, parameters }
}

function getAdditionalOptions (owner, repository, action) {
  return !repository && action === 'PUT'
    ? { visibility: 'all' }
    : {}
}

module.exports = {
  getSecretsPath,
  getAdditionalOptions
}
