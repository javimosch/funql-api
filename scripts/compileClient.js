let code = require('sander').readFileSync(require('path').join(process.cwd(), 'client.js')).toString('utf-8')
require("@babel/core").transform(code, {
    plugins: ["transform-es2015-modules-commonjs"]
}, function(err, result) {
    //result; // => { code, map, ast }
    console.log(err)
    require('sander').writeFileSync(require('path').join(process.cwd(), 'client.cjs.js'), result.code)
});