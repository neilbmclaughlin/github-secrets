#!/usr/bin/env node

const fs = require('fs')
const readline = require('readline')
const sodium = require('tweetsodium')
const { Octokit } = require('@octokit/core')
const yargs = require('yargs/yargs')(process.argv.slice(2))

const argv = yargs
  .command('put [option] <filename>', 'put secrets to repository from a file', {
    a: {
      alias: 'access-token',
      nargs: 1,
      describe: 'Github personal access token'
    },
    o: {
      alias: 'owner',
      nargs: 1,
      describe: 'Github repository owner'
    },
    r: {
      alias: 'repository',
      nargs: 1,
      describe: 'Github repository'
    }
  })
  .demandOption(['a', 'o', 'r'])
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

async function putSecrets (accessToken, filename, owner, repo) {
  const octokit = new Octokit({ auth: accessToken })
  const fileStream = fs.createReadStream(filename)
  const response = await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/public-key', {
    owner,
    repo
  })
  const publicKey = response.data.key
  const publicKeyId = response.data.key_id

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    const [key, value] = line.split('=')
    await octokit.request('PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
      owner,
      repo,
      secret_name: key,
      encrypted_value: encrypt(publicKey, value),
      key_id: publicKeyId
    })
  }
}

putSecrets(argv.a, argv.filename, argv.o, argv.r)
