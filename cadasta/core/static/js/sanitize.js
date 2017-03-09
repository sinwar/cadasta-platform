window.Parsley
  .addValidator('sanitize', function (value, requirement) {
    var emojis = /.*[\ud83c[\udf00-\udfff]|\ud83d[\udc00-\ude4f]|\ud83d[\ude80-\udeff]].*/;
    var macros = /^[-=+@]/;
    return !value.match(emojis) && !value.match(macros);
  }, 2)
  .addMessage('sanitize', gettext('Input can not contain HTML tags, emojis or start with any of + - = and @.'));
