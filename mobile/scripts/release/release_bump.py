# Code inspired by automated script in `lovegaoshi/azusa-player-mobile`
# repository (https://github.com/lovegaoshi/azusa-player-mobile).
#   - https://github.com/lovegaoshi/azusa-player-mobile/blob/master/scripts/release_bump.py

import subprocess
import sys
import typing
from pathlib import Path

import color as c
from version_bump import bumpVersion, getVersion, getVersionSegments


# Define some constants.
Actions = typing.Literal["major", "minor", "patch", "rc", "release"]
availableActions: typing.Tuple[Actions, ...] = typing.get_args(Actions)


def updateVersion(currVersion=getVersion(), action: Actions = "patch", asRC=False):
  """
  Returns the newest version based on the provided inputs.
  """
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
      # Reset version numbers below current increment.
      if action == "major":
        currSemver["minor"] = 0
      if action in ["major", "minor"]:
        currSemver["patch"] = 0

  major, minor, patch, rc = currSemver.values()
  rcStr = f"-rc.{rc}" if rc != None else ""
  return f"{major}.{minor}.{patch}{rcStr}"


def cliConfirmation(actionMessage: str, confirmMessage: str, cancelMessage: str):
  """
  Displays a message in the terminal, asking for confirmation before the
  action is enacted.
  """
  print(actionMessage)
  confirmationStatus = input(confirmMessage).strip().lower() or "y"
  if (confirmationStatus != "y"):
    print(cancelMessage)
    sys.exit(0)


if __name__ == "__main__":
  import argparse

  # Description of the custom arguments this file accepts.
  parser = argparse.ArgumentParser(
    description="Bump the current release version & release the tag on GitHub."
    )
  parser.add_argument(
    "--action",
    help="How we bump versions. `rc` increments `rc` version & `release` removes the `rc`.",
    choices=availableActions,
    required=True
    )
  parser.add_argument(
    "--asRC",
    action="store_true", # If `--asRC` flag is present, the value is `True`.
    help="If we want to have release candidates. Error for `rc` & `release`."
    )

  args = parser.parse_args()
  
  # 1. Confirm that we want to release on this branch.
  currBranchBytes = subprocess.check_output(["git", "branch", "--show-current"])
  currBranch = currBranchBytes.splitlines()[0].decode()
  cliConfirmation(
    f"\nDo you want to create a release on branch {c.BOLD}`{currBranch}`{c.DEFAULT}.",
    f"Confirm branch? ({c.BOLD}Y{c.DEFAULT}/n) ",
    f"{c.HIGHLIGHTED_RED}Cancelled release.{c.DEFAULT}",
  )

  # 2. Confirm the new release version.
  currVersion = getVersion()
  newVersion = f"v{updateVersion(currVersion, args.action, args.asRC)}"
  cliConfirmation(
    f"\nUpdating version {c.HIGHLIGHTED_RED}v{currVersion}{c.DEFAULT} to {c.HIGHLIGHTED_GREEN}{newVersion}{c.DEFAULT}.",
    f"Confirm change? ({c.BOLD}Y{c.DEFAULT}/n) ",
    f"{c.HIGHLIGHTED_RED}Cancelled changes.{c.DEFAULT}",
  )

  # 3. Update version in `Config.ts`.
  app_config = [f'export const APP_VERSION = "{newVersion}";\n']
  with open(Path("./src/constants/Config.ts"), encoding="utf8") as f:
    f.readline()
    for line in f:
      app_config.append(line)
  with open(Path("./src/constants/Config.ts"), "w", encoding="utf8") as f:
    for line in app_config:
      f.write(line)

  # 4. Bump version throughout app based on new change.
  bumpVersion()

  # 5. Commit changes & create new tag.
  subprocess.call([
      "git", "add", "./src/constants/Config.ts",
                    "./package.json",
                    "./app.config.ts",
                    "./android/app/build.gradle"
    ])
  subprocess.call(["git",
      "-c", "user.name='MissingCore-Bot'",
      "-c", "user.email='170483286+MissingCore-Bot@users.noreply.github.com'",
      "commit", "-m", f"release: {newVersion}"
    ])
  subprocess.call(["git", "tag", f"{newVersion}"])

  # 6. Push changes to GitHub?
  cliConfirmation(
    f"\nCreated tag {c.HIGHLIGHTED_GREEN}{newVersion}{c.DEFAULT}.",
    f"Push changes to GitHub? ({c.BOLD}Y{c.DEFAULT}/n) ",
    f"{c.HIGHLIGHTED_RED}Cancelled push to GitHub.{c.DEFAULT}",
  )

  subprocess.call(["git", "push", "origin", currBranch, "--tags"])
