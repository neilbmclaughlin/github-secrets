const chai = require('chai')
const { getSecretsPath, getAdditionalOptions } = require('../../bin/lib/secrets')

const expect = chai.expect

describe('getSecretsPath', () => {
  it('should return path template and populated object for org and repo', () => {
    const path = getSecretsPath('bob', 'repo1')
    expect(path).to.be.eql('/repos/bob/repo1/actions/secrets')
  })
  it('should return path template and populated object for org only', () => {
    const path = getSecretsPath('bob')
    expect(path).to.be.eql('/orgs/bob/actions/secrets')
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
