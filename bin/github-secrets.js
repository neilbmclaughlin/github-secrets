#!/usr/bin/env node

const fs = require('fs')
const chalk = require('chalk')
const sodium = require('tweetsodium')
const { Octokit } = require('@octokit/core')
const yargs = require('yargs/yargs')(process.argv.slice(2))
const { getSecretsPath, getAdditionalOptions } = require('./lib/secrets')
const runPipeline = require('./lib/pipeline')

const builder = {
  a: {
    demandOption: true,
    alias: 'access-token',
    nargs: 1,
    describe: 'Github personal access token'
  },
  o: {
    alias: 'owner',
    nargs: 1,
    describe: 'Github repository owner (defaults to access token owner)'
  },
  r: {
    alias: 'repository',
    nargs: 1,
    describe: 'Github repository'
  }
}
const envVarMsg = 'Options can also be specified in env vars prepended with \'GITHUB_SECRETS\' (e.g. GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)'

const putBuilder = {
  s: {
    alias: 'separator',
    nargs: 1,
    describe: 'key-value pair separator',
    default: ' '
  },
  ...builder
}
// eslint-disable-next-line no-unused-expressions
yargs
  .usage('$0 <cmd> [options]')
  .command(
    'put [filename]',
    'upsert repository secrets from either a file or stdin',
    putBuilder,
    async (argv) => {
      putSecrets(argv.accessToken, argv.filename, argv.owner, argv.repository, argv.separator)
        .catch((err) => { console.log(`${chalk.red('fail')} (${chalk.grey(err.extended ? err.extended.message : err)})`) })
    }
  )
  .command(
    'delete [filename]',
    'delete repository secrets from either a file or stdin',
    builder,
    async (argv) => {
      deleteSecrets(argv.accessToken, argv.filename, argv.owner, argv.repository)
        .catch((err) => { console.log(`${chalk.red('fail')} (${chalk.grey(err.extended ? err.extended.message : err)})`) })
    }
  )
  .example([
    ['1) $0 put -a {access-token} -o {org|user} -r {repo} test/data/env2', 'Put secrets from a file of space separated name-value pairs'],
    ['2) $0 put -a {access-token} -o {org|user} -r {repo} -s= test/data/env', 'Put secrets from an .env format file'],
    ['3) cut -f1 -d\' \' test/data/env2 | $0 delete -a {access-token} -o {org|user} -r {repo}', 'Delete secrets from a file'],
    ['4) curl -s https://raw.githubusercontent.com/neilbmclaughlin/github-secrets/main/test/data/env2 | github-secrets put -a {access-token} -o {org|user} -r {repo}', 'Put secrets from a URL (which should not be public!)']
  ])
  .epilog(envVarMsg)
  .env('GITHUB_SECRETS')
  .argv

async function getAccessTokenUser (accessToken) {
  const { data } = await githubRequest(accessToken, 'GET /user')
  return data.login
}

function encrypt (publicKey, value) {
  // Convert the message and key to Uint8Array's (Buffer implements that interface)
  const messageBytes = Buffer.from(value)
  const keyBytes = Buffer.from(publicKey, 'base64')

  // Encrypt using LibSodium.
  const encryptedBytes = sodium.seal(messageBytes, keyBytes)

  // Base64 the encrypted secret
  const encrypted = Buffer.from(encryptedBytes).toString('base64')

  return encrypted
}

async function githubRequest (accessToken, restCmd, options = {}) {
  const octokit = new Octokit({ auth: accessToken })
  try {
    return await octokit.request(restCmd, options)
  } catch (err) {
    err.extended = {
      message: `githubRequest failed (status ${err.status}): ${restCmd} ${JSON.stringify(options)}`
    }
    throw err
  }
}

async function getPublicKey (accessToken, owner, repository) {
  const path = getSecretsPath(owner, repository)
  const restCmd = `GET ${path}/public-key`
  const response = await githubRequest(accessToken, restCmd)
  return { publicKey: response.data.key, publicKeyId: response.data.key_id }
}

async function checkSecretsSupported (accessToken, owner, repository) {
  if (!repository) {
    const { data: { type } } = await githubRequest(accessToken, `/users/${owner}`)
    if (type === 'User') {
      throw Error(`${owner} is a user and a repository has not been specified. Secrets can only be stored for repositorys and organisations.`)
    }
  }
}

async function actionSecret (accessToken, restCmd, verb, options, secret) {
  await githubRequest(accessToken, restCmd, options)
  console.log(`${verb} secret ${secret}`)
}

function getStream (filename) {
  return filename ? fs.createReadStream(filename) : process.stdin
}

async function checkSecretsAccess (accessToken, owner, repository) {
  const path = getSecretsPath(owner, repository)
  try {
    await githubRequest(accessToken, `HEAD ${path}`)
  } catch (err) {
    if (err.status) {
      switch (err.status) {
        case 404:
          throw Error(`repository ${path} - not found.`)
        case 401:
          throw Error(`repository ${path} - permission denied.`)
        default:
          throw err
      }
    }
  }
}

async function validation (accessToken, owner, repository) {
  await checkSecretsSupported(accessToken, owner, repository)
  await checkSecretsAccess(accessToken, owner, repository)
}

function emptyLineFilter (line) {
  const { name } = JSON.parse(line)
  return name && name.length > 0
}

async function putSecrets (accessToken, filename, owner, repository, separator) {
  owner = owner || await getAccessTokenUser(accessToken)
  await validation(accessToken, owner, repository)
  const { publicKey, publicKeyId } = await getPublicKey(accessToken, owner, repository)

  const path = getSecretsPath(owner, repository)
  const additionalOptions = getAdditionalOptions(owner, repository, 'PUT')
  const stream = getStream(filename)
  const secretParser = line => {
    // use regex to ensure only the first occurence of the separator
    // is used in the split. For example:
    // 'foo=bar=boo=hoo' => [ 'foo', 'bar=boo=hoo' ] when separator is =
    const regex = RegExp(`^([^${separator}]+)${separator}(.+)`)
    const [, name, value] = line.split(regex)
    return JSON.stringify({ name, value })
  }
  const secretPutter = async l => {
    const { name, value } = JSON.parse(l)
    const fullname = `${path}/${name}`
    const restCmd = `PUT ${fullname}`
    const options = {
      encrypted_value: encrypt(publicKey, value),
      key_id: publicKeyId,
      ...additionalOptions
    }
    await actionSecret(accessToken, restCmd, 'added', options, fullname)
  }
  runPipeline(stream, secretParser, emptyLineFilter, secretPutter)
}

async function deleteSecrets (accessToken, filename, owner, repository) {
  owner = owner || await getAccessTokenUser(accessToken)
  await validation(accessToken, owner, repository)

  const path = getSecretsPath(owner, repository)
  const options = getAdditionalOptions(owner, repository, 'DELETE')
  const stream = getStream(filename)
  const secretParser = line => {
    return JSON.stringify({ name: line })
  }
  const secretDeleter = async l => {
    const { name } = JSON.parse(l)
    const fullname = `${path}/${name}`
    const restCmd = `DELETE ${fullname}`
    try {
      await actionSecret(accessToken, restCmd, 'deleted', options, fullname)
    } catch (err) {
      if (err.status && err.status === 404) {
        console.log(`secret ${fullname} not found`)
      } else {
        throw err
      }
    }
  }
  runPipeline(stream, secretParser, emptyLineFilter, secretDeleter)
}
