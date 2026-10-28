const path = require('path');

module.exports = (currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...(currentConfiguration.resolve?.alias || {}),
        "@": path.resolve(__dirname, "../../../../fe/src"),
      },
    },
  };
};
