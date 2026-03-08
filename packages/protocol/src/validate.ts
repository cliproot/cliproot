import type { ErrorObject } from 'ajv';
import { Ajv2020 } from 'ajv/dist/2020.js';
import * as addFormatsPlugin from 'ajv-formats';

import { CRP_V0_0_1_SCHEMA } from './schema.js';
import type { CrpBundle } from './types.js';

export interface ValidationIssue {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  message: string;
}

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  errors: ValidationIssue[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export class CrpValidationError extends Error {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[], message = 'CRP bundle validation failed.') {
    super(message);
    this.name = 'CrpValidationError';
    this.issues = issues;
  }
}

/** @deprecated Use `CrpValidationError`. */
export class SppValidationError extends CrpValidationError {}

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  validateFormats: true,
});

const addFormats = addFormatsPlugin as unknown as { default: (instance: Ajv2020) => void };
addFormats.default(ajv);

const validateCompiled = ajv.compile(CRP_V0_0_1_SCHEMA);

function pointerJoin(basePath: string, key: string): string {
  const normalizedBase = basePath || '';
  const escapedKey = key.replace(/~/g, '~0').replace(/\//g, '~1');
  return `${normalizedBase}/${escapedKey}`;
}

function toValidationIssue(error: ErrorObject): ValidationIssue {
  let instancePath = error.instancePath || '';

  if (error.keyword === 'required') {
    const params = error.params as { missingProperty?: string };
    if (params.missingProperty) {
      instancePath = pointerJoin(instancePath, params.missingProperty);
    }
  }

  return {
    instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message ?? 'Validation error',
  };
}

function collectIssues(errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  return (errors ?? []).map(toValidationIssue);
}

export function validateBundle(input: unknown): ValidationResult<CrpBundle> {
  const valid = validateCompiled(input);

  if (valid) {
    return {
      ok: true,
      value: input as CrpBundle,
    };
  }

  return {
    ok: false,
    errors: collectIssues(validateCompiled.errors),
  };
}

export function parseBundle(input: unknown): CrpBundle {
  const result = validateBundle(input);
  if (!result.ok) {
    throw new CrpValidationError(result.errors);
  }

  return result.value;
}
