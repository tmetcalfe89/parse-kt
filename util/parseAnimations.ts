import parseParams from "./parseParams";
import { Variables } from "./parseVariables";

interface FindParamOptions {
  paramIndex?: number;
  paramKey?: string;
  varName?: string;
  varParser?: (value: string) => any;
}

function beforeTheF(raw: string) {
  if (!raw.includes("F")) return raw;
  return raw.slice(0, raw.indexOf("F"));
}

function findParam(
  params: Record<string, any>,
  vars: Record<string, any>,
  { paramIndex, paramKey, varName, varParser = (e) => e }: FindParamOptions = {}
) {
  const param =
    (paramKey != undefined && params[paramKey]) ||
    (paramIndex != undefined && params[paramIndex]);
  if (param) return varParser(param.replace(/['"]/g, ""));

  const variable = varName != undefined && vars[varName];
  if (variable) return varParser(variable.value);

  return null;
}

const animations: Record<
  string,
  { parse: (params: Record<string, any>, vars: Record<string, any>) => string }
> = {
  singleBoneLook: {
    parse: (params, vars) => {
      const boneName = findParam(params, vars, {
        paramIndex: 0,
        paramKey: "boneName",
        varName: "head",
        varParser: (value) => value.match(/\("(\w+)"\)/)?.[1],
      });
      return `q.look('${boneName}')`;
    },
  },
  bedrock: {
    parse: (params, vars) => {
      const group = findParam(params, vars, {
        paramIndex: 0,
        paramKey: "group",
      });
      const animation = findParam(params, vars, {
        paramIndex: 1,
        paramKey: "animation",
      });
      return `q.bedrock('${group}', '${animation}')`;
    },
  },
  BipedWalkAnimation: {
    parse: (params, vars) => {
      const periodMultiplier = findParam(params, vars, {
        paramKey: "periodMultiplier",
      }).slice(0, -1);
      const amplitudeMultiplier = findParam(params, vars, {
        paramKey: "amplitudeMultiplier",
      }).slice(0, -1);
      const leftLeg = findParam(params, vars, {
        paramKey: "leftLeg",
        varName: "leftLeg",
        varParser: (value) => value.match(/\("(\w+)"\)/)?.[1],
      });
      const rightLeg = findParam(params, vars, {
        paramKey: "rightLeg",
        varName: "rightLeg",
        varParser: (value) => value.match(/\("(\w+)"\)/)?.[1],
      });
      return `q.biped_walk(${periodMultiplier}, ${amplitudeMultiplier}, '${leftLeg}', '${rightLeg}')`;
    },
  },
  BimanualSwingAnimation: {
    parse: (params, vars) => {
      const swingPeriodMultiplier = findParam(params, vars, {
        paramKey: "swingPeriodMultiplier",
      }).slice(0, -1);
      const amplitudeMultiplier = findParam(params, vars, {
        paramKey: "amplitudeMultiplier",
      }).slice(0, -1);
      const leftArm = findParam(params, vars, {
        paramKey: "leftArm",
        varName: "leftArm",
        varParser: (value) => value.match(/\("(\w+)"\)/)?.[1],
      });
      const rightArm = findParam(params, vars, {
        paramKey: "rightArm",
        varName: "rightArm",
        varParser: (value) => value.match(/\("(\w+)"\)/)?.[1],
      });
      return `q.bimanual_swing(${swingPeriodMultiplier}, ${amplitudeMultiplier}, '${leftArm}', '${rightArm}')`;
    },
  },
  "quirk { bedrockStateful": {
    parse: (params, vars) => {
      const group = findParam(params, vars, {
        paramIndex: 0,
        paramKey: "group",
      });
      const animation = findParam(params, vars, {
        paramIndex: 1,
        paramKey: "animation",
      });
      return `q.bedrock_quirk('${group}', '${animation}')`;
    },
  },
  QuadrupedWalkAnimation: {
    parse: (params, vars) => {
      return `q.quadruped_walk()`;
    },
  },
  WingFlapIdleAnimation: {
    parse: (params, vars) => {
      const rotation = findParam(params, vars, {
        paramKey: "rotation",
        varParser: (value) => value && parseParams(value, vars),
      });
      const flapFunction = findParam(params, vars, {
        paramKey: "flapFunction",
        varParser: (value) => value && parseParams(value, vars),
      });
      const axis = findParam(params, vars, {
        paramKey: "axis",
      });
      const wingLeft = findParam(params, vars, {
        paramKey: "leftWing",
        varName: "leftWing",
        varParser: (value) => value.match(/\("(\w+)"\)/)?.[1],
      });
      const wingRight = findParam(params, vars, {
        paramKey: "rightWing",
        varName: "rightWing",
        varParser: (value) => value.match(/\("(\w+)"\)/)?.[1],
      });
      const { verticalShift, period, amplitude } =
        rotation || flapFunction || {};
      return `q.sine_wing_flap(${beforeTheF(amplitude)}, ${beforeTheF(
        period
      )}, ${beforeTheF(verticalShift)}, '${axis
        .slice(axis.indexOf(".") + 1, axis.indexOf("_AXIS"))
        .toLowerCase()}', '${wingLeft}', '${wingRight}')`;
    },
  },
};

function parseAnimation(raw: string, vars: Variables) {
  const { _func, ...params } = parseParams(raw, vars, { returnFunc: true });
  if (!(_func in animations)) {
    throw new Error(`Unknown animation: ${_func}`);
  }
  return animations[_func].parse(params, vars);
}

export default function parseAnimations(raw: string, vars: Variables) {
  const params = parseParams(raw, vars);
  const animations = Object.values(params);
  return animations.map((e) => parseAnimation(e, vars));
}
