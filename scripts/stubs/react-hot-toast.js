/* Stub used by the render smoke test: react-hot-toast's styling layer needs a
   real browser DOM at import time, which the SSR harness does not have. */
const noop = () => {}

const toast = Object.assign(noop, {
  success: noop,
  error: noop,
  loading: noop,
  dismiss: noop,
  remove: noop,
  custom: noop,
  promise: (value) => Promise.resolve(value),
})

export const Toaster = () => null
export default toast
