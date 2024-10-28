import getMatchingEndParen from "./util/getMatchingEndParen.ts";
import parseAnimations from "./util/parseAnimations.ts";
import parseParams from "./util/parseParams.ts";
import parseVariables from "./util/parseVariables.ts";

interface PoseParamsBase {
  transformTicks: string;
  animations: string;
  quirks: string;
}

interface SingleTypePoseParams extends PoseParamsBase {
  poseName?: never;
  poseTypes?: never;
  poseType: string;
}

interface MultiTypePoseParams extends PoseParamsBase {
  poseName: string;
  poseTypes: string;
  poseType?: never;
}

type PoseParams = SingleTypePoseParams | MultiTypePoseParams;

interface RawPoseData {
  start: number;
  end: number;
  content: string;
}

const poseCollections = {
  FLYING_POSES: ["FLY", "HOVER"],
  SWIMMING_POSES: ["SWIM", "FLOAT"],
  STANDING_POSES: ["STAND", "WALK"],
  SHOULDER_POSES: ["SHOULDER_LEFT", "SHOULDER_RIGHT"],
  UI_POSES: ["PROFILE", "PORTRAIT"],
  MOVING_POSES: ["WALK", "SWIM", "FLY"],
  STATIONARY_POSES: ["STAND", "FLOAT", "HOVER"],
};

export default function parseKt(fileText: string) {
  const vars = parseVariables(fileText);

  function findRootBone(): string | undefined {
    const rootBone = vars.rootPart;
    if (!rootBone?.value) throw new Error("No root bone found");
    return rootBone.value.match(/"([^"]+)"/)?.[1];
  }

  function findScale(key: string): number | undefined {
    const scale = vars[key];
    if (!scale?.value) return undefined;
    return +scale.value.slice(0, -1);
  }

  function findTranslation(key: string): number[] | undefined {
    const translation = vars[key];
    if (!translation?.value) return undefined;
    return Object.values(parseParams(translation.value, vars)).map(Number);
  }

  function findRawPose(str: string): RawPoseData | null {
    const startIndex = str.indexOf("registerPose(");
    if (startIndex === -1) return null;
    const endIndex = getMatchingEndParen(
      str,
      startIndex + "registerPose(".length
    );
    if (endIndex === -1) {
      throw new Error("Unbalanced parentheses");
    } else {
      return {
        start: startIndex,
        end: endIndex,
        content: str.slice(startIndex, endIndex),
      };
    }
  }

  function findRawPoses(str: string, poses: string[] = []): string[] {
    const pose = findRawPose(str);
    if (pose) {
      return findRawPoses(str.slice(pose.end), [...poses, pose.content]);
    }
    return poses;
  }

  function parsePoseTypes(raw: string | undefined): string[] | undefined {
    const singleTypePrefix = "PoseType.";
    return raw
      ?.split("+")
      .map((e) => e.trim())
      .flatMap((pose) =>
        pose.startsWith(singleTypePrefix)
          ? pose.slice(singleTypePrefix.length)
          : poseCollections[pose]
      );
  }

  function parsePose(poseParams: PoseParams) {
    return {
      poseName: poseParams.poseType
        ? poseParams.poseType.toLowerCase().split(".").pop()
        : poseParams.poseName?.replace(/"/g, ""),
      poseTypes: poseParams.poseTypes
        ? parsePoseTypes(poseParams.poseTypes)
        : [poseParams.poseType!.split(".").pop()],
      animations: parseAnimations(poseParams.animations, vars),
      transformTicks: +poseParams.transformTicks || undefined,
      quirks: poseParams.quirks
        ? parseAnimations(poseParams.quirks, vars)
        : undefined,
    };
  }

  function findPoses() {
    // @ts-ignore I'm breaking the law here, but it's for a good cause.
    const rawPoses = findRawPoses(fileText).map((e, i) =>
      parseParams(e, vars)
    ) as PoseParams[];
    return (
      rawPoses
        .map(parsePose)
        // .map((e) => ({ ...e, rawPoses }))
        // @ts-ignore I'm also breaking the law here, but it's for a bad cause.
        .reduce((acc, entry) => ({ ...acc, [entry.poseName]: entry }), {})
    );
  }

  return {
    rootBone: findRootBone(),
    portraitScale: findScale("portraitScale"),
    portraitTranslation: findTranslation("portraitTranslation"),
    profileScale: findScale("profileScale"),
    profileTranslation: findTranslation("profileTranslation"),
    poses: findPoses(),
  };
}
