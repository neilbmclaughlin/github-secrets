function getSecretsPath (owner, repository) {
  return repository
    ? `/repos/${owner}/${repository}/actions/secrets`
    : `/orgs/${owner}/actions/secrets`
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
