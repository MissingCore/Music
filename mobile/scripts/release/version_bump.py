# Code inspired by automated script in `lovegaoshi/azusa-player-mobile`
# repository (https://github.com/lovegaoshi/azusa-player-mobile).
#   - https://github.com/lovegaoshi/azusa-player-mobile/blob/master/scripts/version_bump.py

import re
import json
from pathlib import Path
from typing import TypedDict


def getVersion():
  """
  We'll handle app version by only updating the value in `Config.ts`. The
  first line should always look like:
    `export const APP_VERSION = "v0.0.0";`
  """
  with open(Path("./src/constants/Config.ts"), encoding="utf8") as f:
    line = f.readline()
    return line.split('"')[1][1:]


class VersionSegments(TypedDict):
  """
  Give type hint for dictionary returned from `getVersionSegments()`.
  """
  major: int
  minor: int
  patch: int
  rc: int | None


def getVersionSegments(version=getVersion()) -> VersionSegments:
  """
  List out parts of a "semver" version as an object.
  """
  splitVersionStr = version.split("-rc.")
  currVersion = splitVersionStr[0]
  rc = int(splitVersionStr[1]) if len(splitVersionStr) > 1 else None
  [major, minor, patch] = currVersion.split(".")
  return { "major": int(major), "minor": int(minor), "patch": int(patch), "rc": rc }


def bumpVersion():
  """
  This handles bumping the version name & code in `package.json`, `app.config.ts`,
  and `build.gradle`.
  """
  latestVersion = getVersion()

  # Update version in `package.json`.
  with open(Path("./package.json"), encoding="utf8") as f:
    package_json = json.load(f)
  package_json["version"] = latestVersion
  with open(Path("./package.json"), "w", encoding="utf8") as f:
    json.dump(package_json, f, indent=2)
    f.write("\n") # Keep the new line at the end of the file.
  
  # Update version in `app.config.ts`.
  app_config = []
  with open(Path("./app.config.ts"), encoding="utf8") as f:
    for line in f:
      find_versionCode = re.search(r"(.+versionCode: )(\d+),", line)
      find_versionName = re.search(r'(.+version: )".+",', line)
      if (find_versionCode):
        # Get value in 2nd parenthesized subgroup.
        newVersionCode = int(find_versionCode.group(2)) + 1
        app_config.append(
          f"{find_versionCode.group(1)}{newVersionCode},\n"
          )
      elif (find_versionName):
        app_config.append(
          f'{find_versionName.group(1)}"{latestVersion}",\n'
          )
      else:
        app_config.append(line)
  with open(Path("./app.config.ts"), "w", encoding="utf8") as f:
    for line in app_config:
      f.write(line)
  
  # Update version in `build.gradle`.
  build_gradle = []
  with open(Path("./android/app/build.gradle"), encoding="utf8") as f:
    for line in f:
      find_versionCode = re.search(r"(.+versionCode )(\d+)", line)
      find_versionName = re.search(r'(.+versionName )".+"', line)
      if (find_versionCode):
        build_gradle.append(
          f"{find_versionCode.group(1)}{newVersionCode}\n"
          )
      elif (find_versionName):
        build_gradle.append(
          f'{find_versionName.group(1)}"{latestVersion}"\n'
          )
      else:
        build_gradle.append(line)
  with open(Path("./android/app/build.gradle"), "w", encoding="utf8") as f:
    for line in build_gradle:
      f.write(line)
      

if __name__ == "__main__":
  bumpVersion()
  print(f"Version bumped to {getVersion()}")
