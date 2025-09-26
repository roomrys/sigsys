// Configuration schemas and validation for different visualizer types

/**
 * Configuration validator and schema definitions
 */
export class ConfigValidator {
  /**
   * Base schema that all visualizer configurations should extend
   */
  static baseSchema = {
    type: { type: "string", required: true },
    timeRange: {
      type: "object",
      properties: {
        start: { type: "number", default: -Math.PI },
        end: { type: "number", default: Math.PI },
        points: { type: "number", default: 100, min: 10, max: 10000 },
      },
    },
    colors: {
      type: "object",
      properties: {
        orange: { type: "string", default: "orange" },
        blue: { type: "string", default: "blue" },
        green: { type: "string", default: "green" },
        red: { type: "string", default: "red" },
        gray: { type: "string", default: "rgba(128, 128, 128, 0.5)" },
        black: { type: "string", default: "rgba(0, 0, 0, 0.3)" },
      },
    },
    elements: {
      type: "object",
      default: {},
    },
  };

  /**
   * Schema definitions for specific visualizer types
   */
  static schemas = {
    "phase-shift": {
      ...ConfigValidator.baseSchema,
      initialPhaseShift: {
        type: "number",
        default: Math.PI / 4,
        min: 0,
        max: 2 * Math.PI,
      },
      phaseStep: {
        type: "number",
        default: Math.PI / 100,
        min: 0.001,
        max: Math.PI,
      },
      legendVisible: {
        type: "object",
        properties: {
          phaseShiftedCosineChart: { type: "boolean", default: true },
          nonPhaseShiftedCosineChart: { type: "boolean", default: false },
          sineWaveChart: { type: "boolean", default: false },
          complexPlaneChart: { type: "boolean", default: false },
        },
      },
      charts: {
        type: "object",
        properties: {
          phaseShiftedCosine: {
            type: "object",
            properties: {
              canvasId: { type: "string", default: "phaseShiftedCosineChart" },
              titleElementId: {
                type: "string",
                default: "phaseShiftedCosineTitle",
              },
              color: { type: "string", default: "orange" },
              showDecomposedSum: { type: "boolean", default: true },
            },
          },
          nonPhaseShiftedCosine: {
            type: "object",
            properties: {
              canvasId: {
                type: "string",
                default: "nonPhaseShiftedCosineChart",
              },
              titleElementId: {
                type: "string",
                default: "nonPhaseShiftedCosineTitle",
              },
              color: { type: "string", default: "blue" },
              showDecomposedSum: { type: "boolean", default: false },
            },
          },
          sineWave: {
            type: "object",
            properties: {
              canvasId: { type: "string", default: "sineWaveChart" },
              titleElementId: { type: "string", default: "sineWaveTitle" },
              color: { type: "string", default: "green" },
              showDecomposedSum: { type: "boolean", default: false },
              showXAxis: { type: "boolean", default: true },
              flipYLabels: { type: "boolean", default: true },
            },
          },
          complexPlane: {
            type: "object",
            properties: {
              canvasId: { type: "string", default: "complexPlaneChart" },
            },
          },
        },
      },
      elements: {
        type: "object",
        properties: {
          phaseShiftSlider: { type: "string", default: "phaseShiftSlider" },
          phaseShiftValue: { type: "string", default: "phaseShiftValue" },
        },
      },
    },
  };

  /**
   * Validate a configuration object against its schema
   * @param {Object} config - Configuration to validate
   * @param {string} type - Visualizer type
   * @returns {Object} Validation result with { valid: boolean, errors: string[], config: Object }
   */
  static validate(config, type) {
    const result = {
      valid: true,
      errors: [],
      config: {},
    };

    // Check if schema exists for the type
    if (!this.schemas[type]) {
      result.valid = false;
      result.errors.push(`No schema defined for visualizer type: ${type}`);
      return result;
    }

    const schema = this.schemas[type];

    try {
      result.config = this.validateObject(config || {}, schema, "");
    } catch (error) {
      result.valid = false;
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Recursively validate an object against a schema
   * @param {Object} obj - Object to validate
   * @param {Object} schema - Schema to validate against
   * @param {string} path - Current property path for error reporting
   * @returns {Object} Validated and normalized object
   */
  static validateObject(obj, schema, path) {
    const result = {};

    // Process each property in the schema
    Object.entries(schema).forEach(([key, schemaValue]) => {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];

      if (schemaValue.required && (value === undefined || value === null)) {
        throw new Error(`Required property missing: ${currentPath}`);
      }

      if (value !== undefined && value !== null) {
        result[key] = this.validateProperty(value, schemaValue, currentPath);
      } else if (schemaValue.default !== undefined) {
        result[key] =
          typeof schemaValue.default === "object"
            ? JSON.parse(JSON.stringify(schemaValue.default))
            : schemaValue.default;
      }
    });

    // Include any additional properties not in schema
    Object.entries(obj).forEach(([key, value]) => {
      if (!(key in schema)) {
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * Validate a single property against its schema
   * @param {*} value - Value to validate
   * @param {Object} schemaValue - Schema for this property
   * @param {string} path - Property path for error reporting
   * @returns {*} Validated value
   */
  static validateProperty(value, schemaValue, path) {
    // Type validation
    if (schemaValue.type) {
      const expectedType = schemaValue.type;
      const actualType = Array.isArray(value) ? "array" : typeof value;

      if (actualType !== expectedType) {
        throw new Error(
          `Type mismatch at ${path}: expected ${expectedType}, got ${actualType}`
        );
      }
    }

    // Enum validation
    if (schemaValue.enum && !schemaValue.enum.includes(value)) {
      throw new Error(
        `Invalid value at ${path}: must be one of [${schemaValue.enum.join(
          ", "
        )}]`
      );
    }

    // Number range validation
    if (typeof value === "number") {
      if (schemaValue.min !== undefined && value < schemaValue.min) {
        throw new Error(
          `Value at ${path} is below minimum: ${value} < ${schemaValue.min}`
        );
      }
      if (schemaValue.max !== undefined && value > schemaValue.max) {
        throw new Error(
          `Value at ${path} is above maximum: ${value} > ${schemaValue.max}`
        );
      }
    }

    // Object validation (recursive)
    if (schemaValue.type === "object" && schemaValue.properties) {
      return this.validateObject(value, schemaValue.properties, path);
    }

    return value;
  }

  /**
   * Get a complete default configuration for a visualizer type
   * @param {string} type - Visualizer type
   * @returns {Object} Default configuration
   */
  static getDefaultConfig(type) {
    if (!this.schemas[type]) {
      throw new Error(`No schema defined for visualizer type: ${type}`);
    }

    const result = this.validate({}, type);
    if (!result.valid) {
      throw new Error(
        `Failed to generate default config: ${result.errors.join(", ")}`
      );
    }

    return result.config;
  }

  /**
   * Merge user configuration with defaults
   * @param {Object} userConfig - User-provided configuration
   * @param {string} type - Visualizer type
   * @returns {Object} Merged configuration
   */
  static mergeWithDefaults(userConfig, type) {
    const defaultConfig = this.getDefaultConfig(type);
    const result = this.validate(userConfig, type);

    if (!result.valid) {
      throw new Error(
        `Configuration validation failed: ${result.errors.join(", ")}`
      );
    }

    return this.deepMerge(defaultConfig, result.config);
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  static deepMerge(target, source) {
    const result = JSON.parse(JSON.stringify(target));

    Object.keys(source).forEach((key) => {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!result[key]) result[key] = {};
        result[key] = this.deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }
}
