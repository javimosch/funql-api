module.exports = {
    getDebugInstance,
    calculateElapsed,
    stringify
}

function stringify(object = {}) {
    const { parse, stringify } = require('flatted/cjs')
    return stringify(object)
}

function calculateElapsed() {
    var startDate = new Date();
    return function() {
        var endDate = new Date();
        var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
        return seconds + "s";
    };
}

function getDebugInstance(name, level = 4) {
    let levelLabel = {
        1: 'ERROR'.red,
        2: 'WARN'.yellow,
        3: 'INFO'.blue,
        4: 'DEBUG'.grey
    }
    let _level = parseInt(process.env.DEBUG_LEVEL) || 4
    if (level > _level) {
        return () => {}
    } else {
        if (
            (process.env.DEBUG || '').indexOf('funql') === -1 && [1, 2].includes(level)
        ) {
            return function() {
                    let args = Array.prototype.slice.call(arguments)
                    args.unshift(
                            `${`funql:${name}`.padEnd(15, ' ')} ${levelLabel[level].padEnd(
            7,
            ' '
          )} ${`${Date.now()}`.white}`
        )
        console.log.apply(console, args)
      }
    }

    return require('debug')(
      `${`funql:${name}`.padEnd(15, ' ')} ${levelLabel[level].padEnd(7, ' ')} ${
        `${Date.now()}`.white
      }`
    )
  }
}