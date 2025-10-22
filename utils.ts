export function generateKernel(
  size: number,
  max: number,
  sigma: number
): { kernel: number[]; sum: number } {
  if (size % 2 === 0) {
    throw new Error("Kernel size must be an odd number.");
  }

  const kernel: number[] = [];
  let sum: number = 0;
  const center = Math.floor(size / 2);
  const sigmaSq = sigma * sigma;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      // Calculate distance from center
      const x = i - center;
      const y = j - center;

      // Calculate Gaussian PDF value
      // G(x, y) = max * exp(- (x^2 + y^2) / (2 * sigma^2) )
      const exponent = -(x * x + y * y) / (2 * sigmaSq);
      const value = max * Math.exp(exponent);

      kernel.push(value);
      sum += value;
    }
  }

  return { kernel, sum };
}
