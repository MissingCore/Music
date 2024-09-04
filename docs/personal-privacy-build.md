# Personal Privacy Build

This document will go through the steps to build this app for personal privacy. For now, this informs you on how to remove Sentry, the third-party service we use for automatic reporting of any errors encountered.

> [!NOTE]  
> I have built in a feature which notifies users through the Settings page in the app whenever a new version of the app is available (via GitHub Release Notes), which should keep you up-to-date with the latest features.

For simplicity, all of this will be done on GitHub as you don't need to download and set up any unnecessary programs that you may only use once. This means a **GitHub account is required**. You should read [GitHub's Privacy Policy](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). In addition, we removed any unnecessary things found in the [`Building this App`](./building-this-app.md) document as technically, you can use this as an alternate way of building the app.

## Step 1: Forking the repository

Go to the [MissingCore/Music](https://github.com/MissingCore/Music) repository and click the `Fork` button.

<img src="./assets/personal-privacy-build/forking_1.png" alt="Appearance of `Fork` button in repository." />

Then click the `Create fork` button, leaving all fields unchanged.

<img src="./assets/personal-privacy-build/forking_2.png" alt="Appearance of `Create a new fork`screen." />

## Step 2: Create a Personal Access Token

Go to your [GitHub account's setting page](https://github.com/settings/profile) and click `Developer settings`.

<img src="./assets/personal-privacy-build/personal_access_token_1.png" alt="Appearance of `Developer settings`button." />

Open up the `Personal access token` dropdown menu and click `Tokens (classic)`. Then click the `Generate new token` dropdown and the `Generate new token (classic)` option.

<img src="./assets/personal-privacy-build/personal_access_token_2.png" alt="Steps for going to the screen for creating a personal access token (classic)." />

Give a note to this new personal access token (classic) such as "Workflow Token". You then should select an expiration time on the token (for safety reasons and due to infrequent updates, you should set it to `7 days`). Then, select the `workflow` checkbox (the `repo` checkbox will automatically be checked as a result).

> [!IMPORTANT]  
> It's important that you keep the token that's created a secret. If you accidentally leak this token, read [this article from GitHub](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/reviewing-and-revoking-personal-access-tokens-in-your-organization#reviewing-and-revoking--fine-grained-personal-access-tokens) on how you can revoke that token.
>
> In addition, **whenever this token expires, you will have to create a new one again**.

<img src="./assets/personal-privacy-build/personal_access_token_3.png" alt="Configuration for new personal access token (classic)." />

Then click the `Generate token` button after scrolling to the bottom of the screen to create this new token.

Now click the copy button on the token.

Then go back to the forked repository, click the `Settings` tab, open up the `Secrets and variables` dropdown, click `Actions`, then click the `New repository secret` button.

<img src="./assets/personal-privacy-build/personal_access_token_4.png" alt="Steps for creating a new repository secret." />

Then, put `WORKFLOW_TOKEN` in the `Name` field and the value of the token we copied in the `Secret` field. Then click `Add secret`.

<img src="./assets/personal-privacy-build/personal_access_token_5.png" alt="Adding the `WORKFLOW_TOKEN` secret." />

## Step 3: Enabling GitHub Actions

In the newly created forked repository, click the `Actions` tab and then the `I understand my workflows, go ahead and enable them` button.

<img src="./assets/personal-privacy-build/enable_gh_actions.png" alt="Visual steps on enabling GitHub Actions." />

## Step 4: Create branch for latest version of the app (includes pre-release)

> [!IMPORTANT]  
> Depending on the time of writing, the default branch `main` may be replaced with `dev`. In that case, all reference to `main` will be `dev` instead.

Now, click `` Create `latest-stable` Branch `` in the sidebar while in the `Actions` tab. Next click on the `Run workflow` dropdown on the right and click `Run workflow`. Make sure that under `Use workflow from`, `Branch: main` is selected. This will create a new `latest-stable` branch.

<img src="./assets/personal-privacy-build/create_latest_stable_branch.png" alt="Visual steps on creating the `latest-stable` branch." />

> [!IMPORTANT]  
> You should use the `latest-stable` branch instead of the `main` branch as the `main` branch will contain unrelease features that may be unstable or may be structured differently.
>
> In addition, this will also allow you to update the `main` branch of the repository seamlessly for whenever we create a new stable release.

## Step 5: Removing Sentry code

Go back to the `Code` tab and click the dropdown menu which has `main`. From the dropdown, select the `latest-stable` option.

<img src="./assets/personal-privacy-build/remove_sentry_1.png" alt="Visual steps on switching to the `latest-stable` branch." />

Then click on the `mobile` folder, followed by the `src` folder, followed by the `app` folder, and then `_layout.tsx`. You should see something similar to the following (pay attention to the "breadcrumbs" at the top to make sure you're in the right file):

<img src="./assets/personal-privacy-build/remove_sentry_2.png" alt="Screen that you should see if you followed the steps correctly." />

Click the edit button.

<img src="./assets/personal-privacy-build/remove_sentry_3.png" alt="Location of the file edit button." />

Delete the code highlighted below. This may change throughout versions, but in general, it'll start with `Sentry.init({` and end with `});`.

<img src="./assets/personal-privacy-build/remove_sentry_4.png" alt="Sentry code segment that should be removed." />

Then click the `Commit changes...` button. You then need to fill out the details to create a new commit and then click the `Commit changes` button to save these changes.

<img src="./assets/personal-privacy-build/remove_sentry_5.png" alt="Saving these changes." />

> [!NOTE]  
> We previously required you to modify the `gradle.properties` file to make sure the Sentry code run during build-time doesn't actually run. Now, we updated the workflow to automatically add the `music.CREATE_PRIVACY_BUILD=true` to `gradle.properties`.

### Step 6: Creating APKs without Sentry code

Go back to the `Actions` tab and click `Create Privacy Build APKs` in the sidebar. Next click on the `Run workflow` dropdown on the right and **select `Branch: latest-stable`**. Then click `Run workflow`.

<img src="./assets/personal-privacy-build/build_apk_1.png" alt="Visual steps for running the workflow that creates the APKs." />

> [!NOTE]  
> This should take around ~15-20 minutes to complete.

In case you see that the workflow throws an error such as: `Gradle build daemon disappeared unexpectedly (it may have been killed or may have crashed)` or `Execution failed for task ':app:collectReleaseDependencies'.`, just re-run the workflow.

<img src="./assets/personal-privacy-build/build_apk_2.png" alt="Some potential errors thrown." />

To re-run the workflow, you should see a `Re-run jobs` dropdown. Click the `Re-run failed jobs` option.

<img src="./assets/personal-privacy-build/build_apk_3.png" alt="Visual steps for re-running the failed workflow." />

Click the `Re-run jobs` button in the `Re-run failed jobs` pop-up that appears.

### Step 7: Download your APKs

Click the latest successful run of the `Create Privacy Build APKs` workflows. Inside, you should see an `Artifacts` section with an `outputAPKs`. `outputAPKs` is a zip folder containing all the APK types.

<img src="./assets/personal-privacy-build/download_apks.png" alt="Successful build screen." />

Download `outputAPKs` and unzip it. Then, send the `.apk` file to your device for installation (ie: via a USB cable).
`app-arm64-v8a-release.apk` is the one that should be used with most modern devices (you should look up what APK variant your device supports).
