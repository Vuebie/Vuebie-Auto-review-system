module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  plugins: [
    ["babel-plugin-transform-import-meta", {
      "module": "ES6"
    }]
  ],
  env: {
    test: {
      plugins: [
        ["babel-plugin-transform-import-meta", {
          "module": "ES6"
        }]
      ]
    }
  }
};