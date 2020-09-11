const fetch = require('node-fetch');

module.exports.request = async (verb, params) => {
    let res;
    res = verb.toUpperCase() === 'GET' ?
        await fetch(
            params.url, {
                method: verb,
                headers: params.headers
            }) :
        await fetch(
            params.url, {
                method: verb,
                body: params.body,
                headers: params.headers
            });
    console.log(res);
    !~[200, 304].indexOf(res.statusCode)
    return await res.json();
};
