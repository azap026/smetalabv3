declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveSuccessToast(): Promise<R>;
      toHaveErrorToast(errorText?: string): Promise<R>;
    }
  }
}

export {};
