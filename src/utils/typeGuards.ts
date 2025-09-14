export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isValidId = (value: unknown): value is number => {
  return isNumber(value) && value > 0 && Number.isInteger(value);
};

// Safe parameter extraction with type checking
export const extractId = (paramValue: string | undefined, paramName: string): number => {
  if (!paramValue) {
    throw new Error(`${paramName} parameter is required`);
  }
  
  const id = parseInt(paramValue, 10);
  if (!isValidId(id)) {
    throw new Error(`Invalid ${paramName} format - must be a positive integer`);
  }
  
  return id;
};

// Safe query parameter extraction
export const extractOptionalId = (paramValue: string | undefined): number | undefined => {
  if (!paramValue) {
    return undefined;
  }
  
  const id = parseInt(paramValue, 10);
  return isValidId(id) ? id : undefined;
};
