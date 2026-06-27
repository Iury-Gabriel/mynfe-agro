import '@testing-library/jest-dom/vitest'

// jsdom não implementa as APIs de Pointer Capture nem scrollIntoView que o Radix
// (Select/Dropdown) usa ao abrir o menu. Polyfills no-op para os testes de interação.
if (typeof window !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => undefined
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => undefined
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined
  }
}
