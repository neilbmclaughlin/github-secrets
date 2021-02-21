#!/usr/bin/env node

const fs = require('fs')
const chalk = require('chalk')
const readline = require('readline')
const sodium = require('tweetsodium')
const { Octokit } = require('@octokit/core')
const yargs = require('yargs/yargs')(process.argv.slice(2))
const { getSecretsPath, getAdditionalOptions } = require('./lib/secrets')
const builder = {
  a: {
    demandOption: true,
    alias: 'access-token',
    nargs: 1,
    describe: 'Github personal access token'
  },
  o: {
    demandOption: true,
    alias: 'owner',
    nargs: 1,
    describe: 'Github repository owner'
  },
  r: {
    alias: 'repository',
    nargs: 1,
    describe: 'Github repository'
  }
}
const envVarMsg = 'Note: Options can also be specified in env vars prepended with \'GITHUB_SECRETS\' (e.g. GITHUB_SECRETS_ACCESS_TOKEN, GITHUB_SECRETS_OWNER)'

// eslint-disable-next-line no-unused-expressions
yargs
  .command(
    'put [option] <filename>', `upsert repository secrets from a file\n\n${envVarMsg}`,
    builder,
    (argv) => {
      putSecrets(argv.a, argv.filename, argv.o, argv.r)
        .then(() => console.log(chalk.green('put complete')))
        .catch((err) => console.log(`${chalk.red('put failed')} (${chalk.grey(err.message)})`))
    }
  )
  .command(
    'delete [option] <filename>', `delete repository secrets from a file list\n\n${envVarMsg}`,
    builder,
    (argv) => {
      deleteSecrets(argv.a, argv.filename, argv.o, argv.r)
        .then(() => console.log(chalk.green('delete complete')))
        .catch((err) => console.log(`${chalk.red('delete failed')} (${chalk.grey(err.extended.message)})`))
    }
  )
  .env('GITHUB_SECRETS')
  .argv

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

async function githubRequest (accessToken, restCmd, options) {
  const octokit = new Octokit({ auth: accessToken })
  try {
    // console.log({ restCmd, options })
    return await octokit.request(restCmd, options)
  } catch (err) {
    err.extended = {
      message: `githubRequest failed (status ${err.status}): ${restCmd} ${JSON.stringify(options)}`
    }
    throw err
  }
}

async function getPublicKey (accessToken, owner, repository) {
  const { path, parameters } = getSecretsPath(owner, repository)
  const restCmd = `GET ${path}/public-key`
  const response = await githubRequest(accessToken, restCmd, parameters)
  return { publicKey: response.data.key, publicKeyId: response.data.key_id }
}

async function checkSecretsSupported (accessToken, owner, repository) {
  if (!repository) {
    const { data: { type } } = await githubRequest(accessToken, '/users/{owner}', { owner })
    if (type === 'User') {
      throw Error(`${owner} is a user and a repository has not been specified. Secrets can only be stored for repositorys and organisations.`)
    }
  }
}

async function actionSecret (accessToken, restCmd, verb, options, key) {
  try {
    await githubRequest(accessToken, restCmd, options)
    console.log(`${verb} secret ${key}`)
  } catch (err) {
    if (err.status && err.status === 404) {
      console.log(`secret ${key} does not exist`)
    } else {
      throw err
    }
  }
}

async function putSecrets (accessToken, filename, owner, repository) {
  await checkSecretsSupported(accessToken, owner, repository)

  const { publicKey, publicKeyId } = await getPublicKey(accessToken, owner, repository)
  const fileStream = fs.createReadStream(filename)

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  const { path, parameters: pathParameters } = getSecretsPath(owner, repository)
  const additionalOptions = getAdditionalOptions(owner, repository, 'PUT')
  for await (const line of rl) {
    const [key, value] = line.split('=')
    const restCmd = `PUT ${path}/{secret_name}`
    const options = {
      secret_name: key,
      encrypted_value: encrypt(publicKey, value),
      key_id: publicKeyId,
      ...pathParameters,
      ...additionalOptions
    }
    await actionSecret(accessToken, restCmd, 'added', options, key)
  }
}

async function deleteSecrets (accessToken, filename, owner, repository) {
  await checkSecretsSupported(accessToken, owner, repository)

  const fileStream = fs.createReadStream(filename)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  const { path, parameters: pathParameters } = getSecretsPath(owner, repository)
  const additionalOptions = getAdditionalOptions(owner, repository, 'DELETE')
  delete pathParameters.visibility
  const restCmd = `DELETE ${path}/{secret_name}`
  for await (const line of rl) {
    const [key] = line.split('=')
    const options = {
      secret_name: key,
      ...pathParameters,
      ...additionalOptions
    }
    await actionSecret(accessToken, restCmd, 'deleted', options, key)
  }
}
