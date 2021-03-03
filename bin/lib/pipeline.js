// From: https://github.com/manisuec/study/tree/master/streams

// const fs = require('fs')
// const path = require('path')
const chalk = require('chalk')
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
    async write (chunk, encoding, next) {
      try {
        await process(chunk)
        return next()
      } catch (e) {
        return next(e)
      }
    }
  })
}

function reporter (err) {
  if (err) {
    console.log(`${chalk.red('fail')} (${chalk.grey(err.extended ? err.extended.message : err)})`)
  } else {
    console.log(chalk.green('success'))
  }
}

// const READ_FILE_PATH = 'test/data/env'

// const readStream = fs.createReadStream(path.resolve(READ_FILE_PATH))
// const writeStream = process.stdout // Note: this needs to be a write to github secrets

function doPipeline (readStream, parser, filter, writer) {
  pipeline(
    readStream,
    split(parser),
    filterData(filter),
    writeData(writer),
    reporter
  )
}

module.exports = doPipeline
