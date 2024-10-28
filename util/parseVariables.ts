interface Variable {
  override: boolean;
  lateinit: boolean;
  scope: string;
  name: string;
  type: string | undefined;
  value: string | undefined;
}

export interface Variables {
  [key: string]: Variable;
}

export default function parseVariables(text: string): Variables {
  return [
    ...text.matchAll(
      /(override)*(lateinit)*\s*(va[lr]) (\w+)(?:: (\w+))*(?: = ([\S\s]+?))*[\n\r]/g
    ),
  ]
    .map((e) => e.slice(1, 7))
    .map(([override, lateinit, scope, name, type, value]) => ({
      override: !!override,
      lateinit: !!lateinit,
      scope,
      name,
      type,
      value,
    }))
    .reduce((acc, variable) => ({ ...acc, [variable.name]: variable }), {});
}
