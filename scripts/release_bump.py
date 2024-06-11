# Code inspired by automated script in `lovegaoshi/azusa-player-mobile`
# repository (https://github.com/lovegaoshi/azusa-player-mobile).
#   - https://github.com/lovegaoshi/azusa-player-mobile/blob/master/scripts/release_bump.py

import subprocess
import sys
import typing
from pathlib import Path

import color as c
from version_bump import getVersion, getVersionSegments


# Define some constants.
Actions = typing.Literal["major", "minor", "patch", "rc", "release"]
availableActions: typing.Tuple[Actions, ...] = typing.get_args(Actions)


# Returns the newest version based on the provided inputs.
def updateVersion(currVersion=getVersion(), action: Actions = "patch", asRC=False):
  currSemver = getVersionSegments(currVersion)

  # Handle cases of incorrect use of the `rc` & `release` actions.
  if args.action in ["rc", "release"]:
    # Throw error if we use the `--asRC` flag incorrectly.
    if args.asRC == True:
      errMsg = f"Cannot have `--action {args.action}` with `--asRC` flag at the same time."
      raise Exception(errMsg)
    # Throw error when we don't have an `rc` version.
    if currSemver["rc"] == None:
      if args.action == "rc":
        raise Exception("Cannot increment `rc` on an already released version.")
      if args.action == "release":
        raise Exception("Cannot release a non-release-candidate version.")
  
  # Increment version based on inputs.
  match action:
    case "release":
      currSemver["rc"] = None
    case "rc":
      currSemver["rc"] += 1
    case _:
      currSemver[action] += 1
      currSemver["rc"] = 1 if asRC else None

  major, minor, patch, rc = currSemver.values()
  rcStr = f"-rc.{rc}" if rc != None else ""
  return f"{major}.{minor}.{patch}{rcStr}"


if __name__ == "__main__":
  import argparse

  parser = argparse.ArgumentParser(
    description="Bump the current release version & release the tag on GitHub."
    )
  parser.add_argument(
    "--action",
    help="How we bump versions. `rc` increments `rc` version & `release` releases `rc`.",
    choices=availableActions,
    required=True
    )
  parser.add_argument(
    "--asRC",
    action="store_true", # If `--asRC` flag is present, the value is `True`.
    help="If we want to have release candidates. Error for `rc` & `release`."
    )

  args = parser.parse_args()
  version = getVersion()
  
  # Get the updated version from our helper function.
  newVersion = f"v{updateVersion(version, args.action, args.asRC)}"

  print(
    f"\nUpdating version {c.HIGHLIGHTED_RED}v{version}{c.DEFAULT} to {c.HIGHLIGHTED_GREEN}{newVersion}{c.DEFAULT}."
    )
  confirmChange = input(f"Confirm change? ({c.BOLD}Y{c.DEFAULT}/n) ").strip().lower() or "y"

  if (confirmChange != "y"):
    print(f"{c.HIGHLIGHTED_RED}Cancelled changes.{c.DEFAULT}")
    sys.exit(0)

  # Update version in `Config.ts`.
  app_config = [f'export const APP_VERSION = "{newVersion}";\n']
  with open(Path("./src/constants/Config.ts"), encoding="utf8") as f:
    f.readline()
    for line in f:
      app_config.append(line)
  with open(Path("./src/constants/Config.ts"), "w", encoding="utf8") as f:
    for line in app_config:
      f.write(line)

  # Create new tag.
  subprocess.call(["git", "switch", "main", "-q"])
  subprocess.call(["git", "add", "./src/constants/Config.ts"])
  subprocess.call(["git", "commit", "-m", f"release: {newVersion}"])
  subprocess.call(["git", "tag", f"{newVersion}"])

  # Push changes to GitHub?
  print(
    f"\nCreated tag {c.HIGHLIGHTED_GREEN}{newVersion}{c.DEFAULT}."
    )
  confirmPush = input(f"Push changes to GitHub? ({c.BOLD}Y{c.DEFAULT}/n) ").strip().lower() or "y"
  if (confirmPush != "y"):
    print(f"{c.HIGHLIGHTED_RED}Cancelled push to GitHub.{c.DEFAULT}")
    sys.exit(0)

  subprocess.call(["git", "push", "origin", "main", "--tags"])
