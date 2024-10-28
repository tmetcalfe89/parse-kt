import { Variables } from "./parseVariables";

function parseParam(text: string, index: number, vars: Variables) {
  const firstEquals = text.indexOf("=");
  if (firstEquals === -1) return { name: index, value: text };

  const firstParen = text.indexOf("(");
  const firstCurly = text.indexOf("{");

  if (
    (firstParen !== -1 && firstEquals > firstParen) ||
    (firstCurly !== -1 && firstEquals > firstCurly)
  ) {
    return { name: index, value: text };
  }

  const name = text.slice(0, firstEquals).trim();
  let value: string | undefined = text.slice(firstEquals + 1).trim();
  if (value in vars) {
    value = vars[value].value;
  }

  return {
    name,
    value,
  };
}

export default function parseParams(
  rawText: string,
  vars: Variables,
  { returnFunc = false } = {}
) {
  let text: string = rawText in vars ? vars[rawText].value! : rawText;
  const rawParams = text.slice(text.indexOf("(") + 1, text.lastIndexOf(")"));

  let nestedParens = 0;
  let nestedCurlies = 0;
  let pointer = 0;
  const found: string[] = [];
  for (let i = 0; i < rawParams.length; i++) {
    const char = rawParams[i];

    if (char === "," && nestedParens === 0 && nestedCurlies === 0) {
      pointer++;
    } else {
      found[pointer] = (found[pointer] || "") + char;
      if (char === "(") nestedParens++;
      else if (char === ")") nestedParens--;
      else if (char === "{") nestedCurlies++;
      else if (char === "}") nestedCurlies--;
    }
  }
  const foundParams: Record<string, string> = found
    .map((e) => e.trim())
    .map((e, i) => parseParam(e, i, vars))
    .reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});

  if (returnFunc) {
    foundParams._func = text.slice(0, text.indexOf("("));
  }

  return foundParams;
}
