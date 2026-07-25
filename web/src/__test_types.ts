import { z } from 'zod';

// Test 1: z.any() in an object
const s1 = z.object({ x: z.any() });
type I1 = z.input<typeof s1>;
type O1 = z.output<typeof s1>;

// Test 2: z.any().transform(Number)
const s2 = z.object({ x: z.any().transform(v => Number(v)).pipe(z.number()) });
type I2 = z.input<typeof s2>;
type O2 = z.output<typeof s2>;

// Test 3: z.number()
const s3 = z.object({ x: z.number() });
type I3 = z.input<typeof s3>;
type O3 = z.output<typeof s3>;

// Test 4: z.coerce.number()
const s4 = z.object({ x: z.coerce.number() });
type I4 = z.input<typeof s4>;
type O4 = z.output<typeof s4>;

// Test 5: z.boolean().default(true)
const s5 = z.object({ x: z.boolean().default(true) });
type I5 = z.input<typeof s5>;
type O5 = z.output<typeof s5>;

// Test 6: z.boolean() (required)
const s6 = z.object({ x: z.boolean() });
type I6 = z.input<typeof s6>;
type O6 = z.output<typeof s6>;

// Check optionality
type CheckI2 = { x: number } extends I2 ? true : false;
type CheckO2 = O2 extends { x: number } ? true : false;

// Check assignability I → O
declare const i2: I2;
const o2: O2 = i2;
declare const i5: I5;
declare const o5: O5;
