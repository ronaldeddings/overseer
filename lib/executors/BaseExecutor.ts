import { Node } from 'reactflow';
import { ExecutionContext } from '../engine/ExecutionContext';

export interface BaseExecutor {
  execute(node: Node, context: ExecutionContext): Promise<any>;
}

export abstract class AbstractExecutor implements BaseExecutor {
  abstract execute(node: Node, context: ExecutionContext): Promise<any>;

  protected interpolateConfig(config: any, context: ExecutionContext): any {
    if (typeof config === 'string') {
      return this.interpolateTemplate(config, context);
    }
    
    if (Array.isArray(config)) {
      return config.map(item => this.interpolateConfig(item, context));
    }
    
    if (typeof config === 'object' && config !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(config)) {
        result[key] = this.interpolateConfig(value, context);
      }
      return result;
    }
    
    return config;
  }

  private interpolateTemplate(template: string, context: ExecutionContext): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const value = context.getValueByPath(path);
      return value === undefined ? match : String(value);
    });
  }
} 