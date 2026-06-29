const chalk = require('chalk');

exports.logStats = (proc, data) => {
  let log = '';

  log += chalk.yellow.bold(`${proc} Process:`);
  log += '\n';

  if (typeof data === 'object') {
    data
      .toString({
        colors: true,
        chunks: false,
      })
      .split(/\r?\n/)
      .forEach((line) => {
        log += `  ${line}\n`;
      });
  } else {
    log += `  ${data}\n`;
  }

  console.log(log);
};

exports.debounce = (fn, delay = 100) => {
  let timer = null;
  let args;
  return (...nextArgs) => {
    args = nextArgs;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
};
