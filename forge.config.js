const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    overwrite: true
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Italo Cruz de Brito',
          homepage: 'https://github.com/italo2v/my-custom-app',
          categories: ['Office'],
          genericName: 'My Finances',
          description: 'Control your finances like a professional!',
          icon: 'icon.png',
          name: 'my-custom-app',
          section: 'Miscellaneous',
          version: '1.0.0'
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          homepage: 'https://github.com/italo2v/my-custom-app',
          categories: ['Office'],
          genericName: 'My Finances',
          productName: 'My Finances',
          description: 'Control your finances like a professional!',
          icon: 'icon.png',
          name: 'my-custom-app',
          version: '1.0.0'
        }
      },
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
