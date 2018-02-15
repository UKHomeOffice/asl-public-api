# asl-public-api

## Installation

To set up private modules:

* Connect to the ACP VPN
* Visit [Artifactory](https://artifactory.digital.homeoffice.gov.uk/artifactory/webapp/) and sign in with your O365 account
* Go to the [npm-virtual](https://artifactory.digital.homeoffice.gov.uk/artifactory/webapp/#/artifacts/browse/tree/General/npm-virtual) repository, and click "Set me up" in the top right corner
* Copy the `_auth` token from the section under "Using basic authentication". It should look something like this:

```
_auth = somelongstring
```

Add the following to your `~/.npmrc` file, where `<AUTH_TOKEN>` is the value you copied above:

```
@asl:registry=https://artifactory.digital.homeoffice.gov.uk/artifactory/api/npm/npm-virtual/
//artifactory.digital.homeoffice.gov.uk/artifactory/api/npm/npm-virtual/:_auth=<AUTH_TOKEN>
//artifactory.digital.homeoffice.gov.uk/artifactory/api/npm/npm-virtual/:always-auth=true
```

You should then be able to install all dependencies.
