/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleDirectories: ["node_modules", "src"],
    moduleNameMapper: {
        "^obsidian$": "<rootDir>/test/__mocks__/obsidian.ts",
    },
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: {
                    module: "CommonJS",
                    moduleResolution: "node",
                    esModuleInterop: true,
                },
            },
        ],
    },
};
