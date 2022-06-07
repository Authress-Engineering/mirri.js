# Mirri.js
Javascript based toolkit for automatically rotating aws IAM access keys in the [AWS Credentials File](https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html). Mirri attempts to swap out AWS IAM Keys. It does this by:
* Determining the current user and profile being used.
* Creating a new IAM access key for this user.
* Downloading the access key.
* Updating the profile's credentials by overwriting the existing access key in the credentials file.
* Marking the original access key as invalid in aws IAM.

[![npm version](https://badge.fury.io/js/mirri.svg)](https://badge.fury.io/js/mirri) [![Build Status](https://travis-ci.org/rhosys/mirri.js.svg?branch=master)](https://travis-ci.org/rhosys/mirri.js)

## Usage

### Rotate
Rotate the access key associated with the profile. Forcing a rotation, will automatically detect and delete extra unused keys.  If force is not specified rotate will fail if there are two keys in use.

```bash
    mirri rotate [--force] [profile name]
```

### Schedule auto rotate
Rotate the access key associated with the profile on a schedule. The default is weekly rotate. Frequency is a crontab frequency.  You must have `mirri` and `node` on your path for default scheduling to work.  If using
cron this means having something like this `PATH=/home/USER/.nvm/versions/node/v8.4.0/bin:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin` specified.  Cron uses a reduced path.  If you don't
wish to specify a path in your crontab instead pass `-p` as an option.
Options:
* `-p --path`: register mirri with the full path to the executable.  This is important if your scheduling system does not contain your node modules in the path.

```bash
    mirri schedule [options] [profile name] [frequency]
```

### Cleanup
AWS only allows two access key per IAM user. If there are already two, only one of them is being used. Cleanup will delete the other key, so that a new one can be created.

```bash
    mirri cleanup [profile name]
```

## Caveats
Since most OS sandbox script execution environment variables cannot be changed with mirri. (For further information see [#1](https://github.com/rhosys/mirri.js/issues/1))
