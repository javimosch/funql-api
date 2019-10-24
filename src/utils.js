module.exports = {
    getDebugInstance
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
        return require('debug')(
                `${`funql:${name}`.padEnd(15, ' ')} ${levelLabel[level].padEnd(5, ' ')} ${
        `${Date.now()}`.white
      }`
    )
  }
}