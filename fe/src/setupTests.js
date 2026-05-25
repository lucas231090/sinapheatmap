import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import { vi } from "vitest";

global.jest = vi;

/* eslint-disable no-undef */
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;
/* eslint-enable no-undef */
