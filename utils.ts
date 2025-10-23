/**
 * Generates a 2D Gaussian kernel.
 *
 * @param size The size of the kernel (must be an odd number).
 * @param max The maximum value (amplitude) of the Gaussian function, typically at the center.
 * @param sigma The standard deviation (sigma) of the Gaussian distribution.
 * @returns An object containing the flattened kernel array (with offsets and values)
 * and the sum of all kernel elements.
 * @throws Error if the size is not an odd number.
 */
export function generateKernel(
  size: number,
  max: number,
  sigma: number
): { kernel: { x: number; value: number }[]; sum: number } {
  if (size % 2 === 0) {
    throw new Error("Kernel size must be an odd number.");
  }

  const kernel: { x: number; value: number }[] = [];
  let sum: number = 0;
  const center = Math.floor(size / 2);
  const sigmaSq = sigma * sigma;

  for (let i = 0; i < size; i++) {
      const x = i - center;

      // Calculate Gaussian PDF value
      // G(x) = max * exp(- x^2 / (2 * sigma^2) )
      const exponent = -(x * x) / (2 * sigmaSq);
      const value = max * Math.exp(exponent);

      kernel.push({ x, value });
    sum += value;
  }

  return { kernel, sum };
}
