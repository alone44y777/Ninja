const chalk = require('chalk');

const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text);
}

const bgcolor = (text, bgcolor) => {
  return !bgcolor ? chalk.green(text) : chalk.bgKeyword(bgcolor)(text);
}

// "Lognyong" ka naam change kar ke NexGenLog kar diya gaya hai
const NexGenLog = (text, color) => {
  return !color ? chalk.yellow('[ NexGen ] ') + chalk.green(text) : chalk.yellow('=> ') + chalk.keyword(color)(text);
}

module.exports = {
  color,
  bgcolor,
  NexGenLog  // Yahan bhi update kar diya
}

// Power By Empire And Ninja 