export default function getMatchingEndParen(str: string, startIndex: number) {
  let nestedParens = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === "(") {
      nestedParens++;
    } else if (str[i] === ")" && nestedParens > 0) {
      nestedParens--;
    } else if (str[i] === ")" && nestedParens === 0) {
      return i + 1;
    }
  }
  return -1;
}
