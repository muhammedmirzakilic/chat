import fs from "fs";
import path from "path";

var bannedWordsRegex;
fs.readFile(path.resolve(__dirname, "./bannedWords.txt"), "utf8", function(
  err,
  contents
) {
  var bannedWords = contents.split("\n");
  var regex = "(\\b" + bannedWords.join("\\b)|(\\b") + "\\b)";
  bannedWordsRegex = new RegExp(regex, "gi");
});

exports.filterText = (text, replacementExpression) => {
  return text.replace(bannedWordsRegex, replacementExpression || "***");
};
