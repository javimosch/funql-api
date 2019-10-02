module.exports = app =>
    async function getAppKeysLength() {
        return Object.keys(app).length
    }