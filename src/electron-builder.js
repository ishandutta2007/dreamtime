/* eslint-disable no-template-curly-in-string */

const pkg = require('./package.json')
require('dotenv').config()

/**
 * Windows Release
 */
const windows = {
  win: {
    target: {
      target: process.env.BUILD_TARGET,
      arch: 'x64',
    },
    artifactName: process.env.BUILD_FILENAME,
    extraResources: [
      {
        from: 'node_modules/7zip-bin/win/x64',
        to: '7zip-bin',
      },
    ],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    uninstallDisplayName: '${productName}',
    deleteAppDataOnUninstall: true,
    displayLanguageSelector: true,
    menuCategory: true,
  },
}

/**
 * Linux Release
 */
const linux = {
  linux: {
    target: {
      target: process.env.BUILD_TARGET,
      arch: 'x64',
    },
    artifactName: process.env.BUILD_FILENAME,
    executableName: 'dreamtimetech',
    synopsis: pkg.description,
    category: 'Graphics',
    extraResources: [
      {
        from: 'node_modules/7zip-bin/linux/x64',
        to: '7zip-bin',
      },
    ],
  },
  snap: {
    confinement: 'strict',
  },
}

/**
 * MacOS Release
 */
const macos = {
  mac: {
    target: {
      target: process.env.BUILD_TARGET,
      arch: 'x64', // TODO: universal/arm64
    },
    artifactName: process.env.BUILD_FILENAME,
    darkModeSupport: true,
    category: 'public.app-category.graphics-design',
    minimumSystemVersion: '10.15.0',
    extraResources: [
      {
        from: 'node_modules/7zip-bin/mac/x64',
        to: '7zip-bin',
      },
    ],
  },
  dmg: {
    title: '${productName}',
  },
}

/**
 * Electron Builder
 */
module.exports = {
  appId: 'com.dreamnet.dreamtime',
  productName: process.env.npm_package_displayName,
  copyright: 'Copyright (C) DreamNet. All rights reserved.',
  directories: {
    output: '../dist',
  },
  files: [
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/*.d.ts',
    '!**/node_modules/.bin',
    '!**/._*',
    '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj,vs,vscode,idea,log,lock}',
    '!**/*.{nyc_output,flowconfig,env.example,eslintrc,prettierrc,tgz,editorconfig}',
    '!**/*.{git,hg,svn,gitignore,gitattributes,travis.yml,yarn-integrity,DS_Store,yarn-integrity}',
    '!**/*.{yarn-metadata.json,jsconfig.json,electron-builder.js,eslintrc.json,eslintrc.js,env-cmdrc.js}',
    '!**/*.{codeclimate.yml,babelrc}',
    '!**/{CVS,RCS,SCCS,eslintrc.json,thumbs.db,appveyor.yml,circle.yml}',
    '!{components,cli,layouts,middleware,mixins,pages,patches,plugins,scripts,store,third,coverage,.nuxt,test,workers}',
    '!{static,assets,electron/src}',
  ],
  extraFiles: [
    {
      from: '.env',
      to: '.env',
    },
    {
      from: 'package.min.json',
      to: 'package.json',
    },
  ],
  ...windows,
  ...linux,
  ...macos,
}
