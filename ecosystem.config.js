module.exports = [
  {
    script: "dist/main.js",
    name: "taxii21-server",
    exec_mode: "cluster",
    instances: 4,
  },
  {
    script: "dist/hydrate.js",
    name: "taxii21-collector",
    exec_mode: "cluster",
    instances: 1,
  },
];
