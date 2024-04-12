const allTags = `*[_type == 'tag'] {
    _id,
    tagName,
    _type
  }`


module.exports = {
    allTags
}