# mirri.js
Javascript based toolkit for automatically rotating aws IAM access keys. Mirri attepmts to swap out AWS IAM Keys. It does this by:
* Determining the current user and profile being used.
* Creating a new IAM access key for this user.
* Downloading the access key.
* Updating the default credentials file by overwritting the existing access key.
* Marking the original access key as invalid in aws IAM.

## Usage

### Rotate
Rotate the access key associated with the profile. Forcing a rotation, will automatically detect and delete extra unused keys.

```bash
    mirri rotate [--force] [profile name]
```

### Schedule auto rotate
Rotate the access key associated with the profile on a schedule. The default is weekly rotate. Frequency is a crontab frequency.

```bash
    mirri schedule [profile name] [frequency]
```

### Cleanup
AWS only allows two access key per IAM user. If there are already two, only one of them is being used. Cleanup will delete the other key, so that a new one can be created.

```bash
    mirri cleanup [profile name]
```