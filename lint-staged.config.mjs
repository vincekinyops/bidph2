/** @type {import('lint-staged').Configuration} */
export default {
  'web/**/*.{ts,tsx}': (filenames) => {
    const files = filenames.map((f) => f.replace(/^web\//, '')).join(' ')
    return [`pnpm --filter web exec eslint --fix --max-warnings 0 ${files}`]
  },
}
