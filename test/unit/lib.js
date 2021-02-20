const chai = require('chai')
const { getSecretsPath, getAdditionalOptions } = require('../../bin/lib/secrets')

const expect = chai.expect

describe('getSecretsPath', () => {
  it('should return path template and populated object for org and repo', () => {
    const path = getSecretsPath('bob', 'repo1')
    expect(path).to.be.eql({ path: '/repos/{owner}/{repository}/actions/secrets', parameters: { owner: 'bob', repository: 'repo1' } })
  })
  it('should return path template and populated object for org only', () => {
    const path = getSecretsPath('bob')
    expect(path).to.be.eql({ path: '/orgs/{owner}/actions/secrets', parameters: { owner: 'bob' } })
  })
})
describe('getSecretsPath', () => {
  it('should return no additional options for delete actions', () => {
    const additionalOptions = getAdditionalOptions('bob', 'repo1', 'DELETE')
    expect(additionalOptions).to.be.eql({})
  })
  it('should additional options for put actions for org', () => {
    const additionalOptions = getAdditionalOptions('bob', undefined, 'PUT')
    expect(additionalOptions).to.be.eql({ visibility: 'all' })
  })
})
