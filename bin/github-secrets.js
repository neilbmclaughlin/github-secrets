#!/usr/bin/env node

const fs = require('fs')
const readline = require('readline')
const sodium = require('tweetsodium')
const { Octokit } = require('@octokit/core')
const yargs = require('yargs/yargs')(process.argv.slice(2))
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

const argv = yargs
  .command(
    'put [option] <filename>', 'upsert repository secrets from a file',
    builder,
    (argv) => {
      putSecrets(argv.a, argv.filename, argv.o, argv.r)
        .then(() => console.log('put successful'))
        .catch((err) => console.log(`put failed (${err.message})`))
    }
  )
  .command(
    'delete [option] <filename>', 'delete repository secrets from a file list',
    builder,
    (argv) => {
      deleteSecrets(argv.a, argv.filename, argv.o, argv.r)
        .then(() => console.log('delete successful'))
        .catch((err) => console.log(`delete failed (${err.message})`))
    }
  )
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

function getSecretsPath (owner, repository) {
  const [path, parameters] = repository
    ? ['/repos/{owner}/{repository}/actions/secrets', { owner, repository }]
    : ['/orgs/{owner}/actions/secrets', { owner, visibility: 'all' }]
  return { path, parameters }
}

async function githubRequest (accessToken, restCmd, options) {
  const octokit = new Octokit({ auth: accessToken })
  try {
    // console.log({ restCmd, options })
    return await octokit.request(restCmd, options)
  } catch (err) {
    throw Error(`githubRequest failed (status ${err.status}): ${restCmd} ${JSON.stringify(options)}`)
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
      console.log(`${owner} is a user and a repository has not been specified.\nSecrets can only be stored for repositorys and organisations. `)
      return false
    }
  }
  return true
}

async function putSecrets (accessToken, filename, owner, repository) {
  if (!await checkSecretsSupported(accessToken, owner, repository)) {
    return
  }
  const { publicKey, publicKeyId } = await getPublicKey(accessToken, owner, repository)
  const fileStream = fs.createReadStream(filename)

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  const { path, parameters: pathParameters } = getSecretsPath(owner, repository)
  for await (const line of rl) {
    const [key, value] = line.split('=')
    const restCmd = `PUT ${path}/{secret_name}`
    const parameters = {
      secret_name: key,
      encrypted_value: encrypt(publicKey, value),
      key_id: publicKeyId,
      ...pathParameters
    }
    await githubRequest(accessToken, restCmd, parameters)
  }
}

async function deleteSecrets (accessToken, filename, owner, repository) {
  if (!await checkSecretsSupported(accessToken, owner, repository)) {
    return
  }

  const fileStream = fs.createReadStream(filename)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  const { path, parameters: pathParameters } = getSecretsPath(owner, repository)
  const restCmd = `DELETE ${path}/{secret_name}`
  for await (const line of rl) {
    const [key] = line.split('=')
    const options = {
      secret_name: key,
      ...pathParameters
    }
    await githubRequest(accessToken, restCmd, options)
  }
}
