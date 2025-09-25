import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(...classNames: string[]): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveValue(value: string | number): R
      toHaveTextContent(text: string): R
      toBeDisabled(): R
      toHaveFocus(): R
      toHaveAccessibleName(name?: string): R
      toHaveAccessibleDescription(description?: string): R
    }
  }
}