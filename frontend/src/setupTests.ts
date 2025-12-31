// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Global FileReader mock for all tests
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  static shouldError = false; // Flag for error simulation

  readAsDataURL(_file: Blob) {
    // Simulate async behavior
    setTimeout(() => {
      if ((MockFileReader as any).shouldError) {
        this.onerror?.(new Error('File read error'));
      } else {
        this.result = 'data:image/png;base64,AA==';
        this.onload?.({ target: { result: this.result } });
      }
    }, 0);
  }
}

Object.defineProperty(window, 'FileReader', { 
  writable: true, 
  value: MockFileReader 
});
