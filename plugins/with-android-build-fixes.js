// Local Android build settings that `npx expo prebuild --clean` would otherwise wipe from android/.
//
//   1. Gradle heap: the template's 2 GB heap / 512 MB metaspace ran out of metaspace on this
//      project and produced corrupt APKs, so it's raised to 4 GB / 1 GB.
//   2. Windows only: the CMake 3.22 that Gradle picks by default ships a ninja that can't open
//      paths over 260 characters, which React Native's codegen object files exceed. This points
//      `cmake.dir` (android/local.properties) at the newest CMake 4+ installed in the SDK.
//      Nothing is written when none is installed, so other machines and EAS are unaffected.

const { withDangerousMod, withGradleProperties } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const JVM_ARGS =
  "-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8";

function withGradleHeap(config) {
  return withGradleProperties(config, (config) => {
    const existing = config.modResults.find(
      (item) => item.type === "property" && item.key === "org.gradle.jvmargs"
    );
    if (existing) {
      existing.value = JVM_ARGS;
    } else {
      config.modResults.push({
        type: "property",
        key: "org.gradle.jvmargs",
        value: JVM_ARGS,
      });
    }
    return config;
  });
}

// Newest `<sdk>/cmake/<version>` with major version 4 or later, as a forward-slash path.
function findLongPathCmake() {
  const sdk =
    process.env.ANDROID_HOME ||
    process.env.ANDROID_SDK_ROOT ||
    (process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, "Android", "Sdk"));
  if (!sdk) return null;

  const cmakeRoot = path.join(sdk, "cmake");
  if (!fs.existsSync(cmakeRoot)) return null;

  const parse = (version) => version.split(".").map((n) => parseInt(n, 10) || 0);
  const newest = fs
    .readdirSync(cmakeRoot)
    .filter((version) => parse(version)[0] >= 4)
    .filter((version) =>
      fs.existsSync(path.join(cmakeRoot, version, "bin", "cmake.exe"))
    )
    .sort((a, b) => {
      const [pa, pb] = [parse(a), parse(b)];
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pb[i] ?? 0) - (pa[i] ?? 0);
      }
      return 0;
    })[0];

  return newest ? path.join(cmakeRoot, newest).split(path.sep).join("/") : null;
}

function withWindowsCmake(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      if (process.platform !== "win32") return config;
      const cmakeDir = findLongPathCmake();
      if (!cmakeDir) return config;

      const file = path.join(
        config.modRequest.platformProjectRoot,
        "local.properties"
      );
      const lines = fs.existsSync(file)
        ? fs
            .readFileSync(file, "utf8")
            .split(/\r?\n/)
            .filter((line) => line && !line.startsWith("cmake.dir="))
        : [];
      lines.push(`cmake.dir=${cmakeDir}`);
      fs.writeFileSync(file, `${lines.join("\n")}\n`);
      return config;
    },
  ]);
}

module.exports = function withAndroidBuildFixes(config) {
  return withWindowsCmake(withGradleHeap(config));
};
