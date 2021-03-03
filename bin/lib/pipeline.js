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

function doPipeline (readStream, parser, filter, writer) {
  pipeline(
    readStream,
    split(parser, null, { trailing: false }),
    filterData(filter),
    writeData(writer),
    reporter
  )
}

module.exports = doPipeline
