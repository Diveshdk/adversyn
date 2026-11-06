import { atomicFlag } from "./atomic-flag.js";
import { frameDuplicate, frameRemove } from "./frame-edit.js";
import { frameOrder } from "./frame-order.js";
import { gasBoundary } from "./gas-boundary.js";
import { roleMutation } from "./role.js";
import type { MutationOperator } from "./types.js";

/** Registry order is the generation order. Do not reorder without expecting different output under --max. */
export const OPERATORS: readonly MutationOperator[] = [
  gasBoundary,
  frameOrder,
  frameRemove,
  frameDuplicate,
  roleMutation,
  atomicFlag,
];

export const operatorIds = (): string[] => OPERATORS.map((o) => o.id);
