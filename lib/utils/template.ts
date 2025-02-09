import { ExecutionContext } from '../engine/ExecutionContext';

/**
 * Interpolates a template string with values from the execution context
 * Example: interpolateTemplate("Hello ${user.name}!", context)
 */
export function interpolateTemplate(template: string, context: ExecutionContext): string {
  return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
    const value = context.getValueByPath(path);
    return value === undefined ? match : String(value);
  });
}

/**
 * Validates that all template variables in a string exist in the context
 */
export function validateTemplate(template: string, context: ExecutionContext): boolean {
  const variables = template.match(/\$\{([^}]+)\}/g) || [];
  return variables.every(variable => {
    const path = variable.slice(2, -1); // Remove ${ and }
    return context.getValueByPath(path) !== undefined;
  });
}

/**
 * Extracts all template variables from a string
 */
export function extractTemplateVariables(template: string): string[] {
  const variables = template.match(/\$\{([^}]+)\}/g) || [];
  return variables.map(variable => variable.slice(2, -1)); // Remove ${ and }
} 