// This file is used to configure Chart.js by importing the 'auto' bundle.
// This ensures all components are registered globally before any charts are rendered.
// By importing this file once in the application's entry point (index.tsx),
// we avoid race conditions and ensure Chart.js is ready.
import 'chart.js/auto';
