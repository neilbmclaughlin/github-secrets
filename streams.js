// From: https://github.com/manisuec/study/tree/master/streams

const fs = require('fs')
const path = require('path')
const split = require('split')
const { Writable, Transform, pipeline } = require('stream')

function filterData (filter) {
  return Transform({
    objectMode: true,
    transform (chunk, encoding, next) {
      try {
        const output = filter(chunk.toString()) ? `${chunk}` : undefined
        return next(null, output)
      } catch (e) {
        return next(e)
      }
    }
  })
}

function writeData (filter) {
  return Writable({
    write (chunk, encoding, next) {
      try {
        console.log({ chunk: chunk.toString() })
        return next()
      } catch (e) {
        return next(e)
      }
    }
  })
}

const READ_FILE_PATH = 'test/data/env'

const readStream = fs.createReadStream(path.resolve(READ_FILE_PATH))
// const writeStream = process.stdout // Note: this needs to be a write to github secrets

pipeline(
  readStream,
  split(),
  filterData(line => line && line.length > 0 && !line.match(/^[\s]*#/)),
  writeData(),
  err => {
    if (err) {
      console.error('Pipeline failed.', err)
    } else {
      console.log('Pipeline succeeded.')
    }
  }
)
