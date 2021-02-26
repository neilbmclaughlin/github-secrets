// From: https://github.com/manisuec/study/tree/master/streams

const fs = require('fs')
const path = require('path')
const split = require('split')
const { Writable, Transform, pipeline } = require('stream')

function filterData (inclusionFilter) {
  return Transform({
    objectMode: true,
    transform (chunk, encoding, next) {
      try {
        const output = inclusionFilter(chunk.toString())
          ? `${chunk}`
          : undefined
        return next(null, output)
      } catch (e) {
        return next(e)
      }
    }
  })
}

function writeData (process) {
  return Writable({
    write (chunk, encoding, next) {
      try {
        process(chunk)
        return next()
      } catch (e) {
        return next(e)
      }
    }
  })
}

function reporter (err) {
  if (err) {
    console.error('Pipeline failed.', err)
  } else {
    console.log('Pipeline succeeded.')
  }
}

const READ_FILE_PATH = 'test/data/env'

const readStream = fs.createReadStream(path.resolve(READ_FILE_PATH))
// const writeStream = process.stdout // Note: this needs to be a write to github secrets

pipeline(
  readStream,
  split(line => {
    const [key, value] = line.split('=')
    return JSON.stringify({ key, value })
  }),
  filterData(l => {
    const { key } = JSON.parse(l)
    return key && key.length > 0 && !key.match(/^[\s]*#/)
  }),
  writeData(l => console.log({ line: JSON.parse(l) })),
  reporter
)
