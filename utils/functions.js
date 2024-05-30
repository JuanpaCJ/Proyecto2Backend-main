function throwCustomError(code, msg) {
    throw new Error(JSON.stringify({ code, msg }));
  }
  
  module.exports = {
    throwCustomError
  };
  